import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

const router = Router();

router.get('/:userId', (req, res) => {
  const { status, sort, limit } = req.query;

  let query = 'SELECT * FROM jobs WHERE user_id = ?';
  const params = [req.params.userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (sort === 'match_score') {
    query += ' ORDER BY match_score DESC';
  } else if (sort === 'date') {
    query += ' ORDER BY created_at DESC';
  } else {
    query += ' ORDER BY updated_at DESC';
  }

  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
  }

  try {
    const jobs = db.prepare(query).all(...params);
    res.json({ jobs, count: jobs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { user_id, title, company, location, job_type, remote_type, description, requirements, salary_range, source_url, source_platform } = req.body;

  if (!user_id || !title || !company) {
    return res.status(400).json({ error: 'user_id, title, and company are required' });
  }

  const id = uuidv4();
  try {
    db.prepare(
      'INSERT INTO jobs (id, user_id, title, company, location, job_type, remote_type, description, requirements, salary_range, source_url, source_platform) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, user_id, title, company, location || '', job_type || 'Full-time', remote_type || 'onsite', description || '', requirements || '', salary_range || '', source_url || '', source_platform || '');

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    res.status(201).json({ job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/detail/:jobId', (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const timeline = db.prepare(
    'SELECT * FROM application_timeline WHERE job_id = ? ORDER BY created_at DESC'
  ).all(req.params.jobId);

  res.json({ job, timeline });
});

router.put('/:jobId', (req, res) => {
  const { status, match_score, eligibility_score, company_research, tailored_resume, strategy_notes } = req.body;
  const jobId = req.params.jobId;

  try {
    const updates = [];
    const params = [];

    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (match_score !== undefined) { updates.push('match_score = ?'); params.push(match_score); }
    if (eligibility_score !== undefined) { updates.push('eligibility_score = ?'); params.push(eligibility_score); }
    if (company_research !== undefined) { updates.push('company_research = ?'); params.push(JSON.stringify(company_research)); }
    if (tailored_resume !== undefined) { updates.push('tailored_resume = ?'); params.push(JSON.stringify(tailored_resume)); }
    if (strategy_notes !== undefined) { updates.push('strategy_notes = ?'); params.push(JSON.stringify(strategy_notes)); }

    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    if (status === 'applied') {
      updates.push('applied_at = CURRENT_TIMESTAMP');
    }

    params.push(jobId);
    db.prepare(`UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    res.json({ job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:jobId', (req, res) => {
  try {
    db.prepare('DELETE FROM application_timeline WHERE job_id = ?').run(req.params.jobId);
    db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.jobId);
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:userId/stats', (req, res) => {
  try {
    const stats = db.prepare(
      'SELECT status, COUNT(*) as count FROM jobs WHERE user_id = ? GROUP BY status'
    ).all(req.params.userId);

    const total = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE user_id = ?').get(req.params.userId);
    const avgMatch = db.prepare('SELECT AVG(match_score) as avg FROM jobs WHERE user_id = ? AND match_score > 0').get(req.params.userId);

    res.json({
      statusBreakdown: stats,
      total: total?.count || 0,
      averageMatchScore: Math.round(avgMatch?.avg || 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

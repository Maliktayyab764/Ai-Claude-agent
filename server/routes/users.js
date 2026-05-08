import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

const router = Router();

router.post('/', (req, res) => {
  const { email, name, preferred_locations, preferred_job_types, preferred_roles, experience_years } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.json({ user: existing, message: 'User already exists' });
  }

  const id = uuidv4();
  try {
    db.prepare(
      'INSERT INTO users (id, email, name, preferred_locations, preferred_job_types, preferred_roles, experience_years) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id, email, name || '',
      JSON.stringify(preferred_locations || []),
      JSON.stringify(preferred_job_types || []),
      JSON.stringify(preferred_roles || []),
      experience_years || 0
    );

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

router.put('/:id', (req, res) => {
  const { name, preferred_locations, preferred_job_types, preferred_roles, experience_years, skills } = req.body;
  const userId = req.params.id;

  try {
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (preferred_locations !== undefined) { updates.push('preferred_locations = ?'); params.push(JSON.stringify(preferred_locations)); }
    if (preferred_job_types !== undefined) { updates.push('preferred_job_types = ?'); params.push(JSON.stringify(preferred_job_types)); }
    if (preferred_roles !== undefined) { updates.push('preferred_roles = ?'); params.push(JSON.stringify(preferred_roles)); }
    if (experience_years !== undefined) { updates.push('experience_years = ?'); params.push(experience_years); }
    if (skills !== undefined) { updates.push('skills = ?'); params.push(JSON.stringify(skills)); }

    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/preferences', (req, res) => {
  const prefs = db.prepare('SELECT * FROM search_preferences WHERE user_id = ?').get(req.params.id);
  const user = db.prepare('SELECT preferred_locations, preferred_job_types, preferred_roles, experience_years, skills FROM users WHERE id = ?').get(req.params.id);
  res.json({ preferences: prefs, userPreferences: user });
});

router.put('/:id/preferences', (req, res) => {
  const userId = req.params.id;
  const { keywords, excluded_companies, min_salary, max_commute_miles, industries, company_sizes } = req.body;

  const existing = db.prepare('SELECT id FROM search_preferences WHERE user_id = ?').get(userId);

  if (existing) {
    db.prepare(
      'UPDATE search_preferences SET keywords = ?, excluded_companies = ?, min_salary = ?, max_commute_miles = ?, industries = ?, company_sizes = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).run(
      JSON.stringify(keywords || []),
      JSON.stringify(excluded_companies || []),
      min_salary || 0,
      max_commute_miles || 0,
      JSON.stringify(industries || []),
      JSON.stringify(company_sizes || []),
      userId
    );
  } else {
    db.prepare(
      'INSERT INTO search_preferences (id, user_id, keywords, excluded_companies, min_salary, max_commute_miles, industries, company_sizes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      uuidv4(), userId,
      JSON.stringify(keywords || []),
      JSON.stringify(excluded_companies || []),
      min_salary || 0,
      max_commute_miles || 0,
      JSON.stringify(industries || []),
      JSON.stringify(company_sizes || [])
    );
  }

  res.json({ success: true, message: 'Preferences updated' });
});

export default router;

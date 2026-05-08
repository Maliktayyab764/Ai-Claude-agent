import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

const router = Router();

export default function createResumeRoutes(orchestrator) {
  router.post('/upload/:userId', upload.single('resume'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const userId = req.params.userId;
    const filePath = req.file.path;

    try {
      const parseResult = await orchestrator.delegateTask('resume', { action: 'parse' }, { filePath, userId });

      if (parseResult.result?.error) {
        return res.status(400).json({ error: parseResult.result.error });
      }

      const resumeData = parseResult.result?.data || parseResult.result;

      db.prepare(
        'UPDATE users SET resume_path = ?, resume_text = ?, skills = ?, experience_years = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(
        filePath,
        resumeData.rawText || '',
        JSON.stringify(resumeData.skills || []),
        resumeData.experienceYears || 0,
        userId
      );

      const analysis = await orchestrator.delegateTask('resume', { action: 'analyze' }, { resumeData });
      const improvements = await orchestrator.delegateTask('resume', { action: 'suggest_improvements' }, { resumeData });
      const atsCheck = await orchestrator.delegateTask('resume', { action: 'optimize' }, { resumeText: resumeData.rawText || '' });

      res.json({
        success: true,
        message: 'Resume uploaded and analyzed successfully',
        file: {
          originalName: req.file.originalname,
          size: req.file.size,
          path: filePath
        },
        resumeData,
        analysis: analysis.result,
        improvements: improvements.result,
        atsOptimization: atsCheck.result
      });
    } catch (err) {
      res.status(500).json({ error: `Failed to process resume: ${err.message}` });
    }
  });

  router.get('/:userId', (req, res) => {
    const user = db.prepare('SELECT resume_path, resume_text, skills, experience_years FROM users WHERE id = ?').get(req.params.userId);

    if (!user || !user.resume_path) {
      return res.status(404).json({ error: 'No resume found for this user' });
    }

    res.json({
      hasResume: true,
      resumePath: user.resume_path,
      skills: user.skills ? JSON.parse(user.skills) : [],
      experienceYears: user.experience_years,
      textLength: user.resume_text?.length || 0
    });
  });

  router.delete('/:userId', (req, res) => {
    const user = db.prepare('SELECT resume_path FROM users WHERE id = ?').get(req.params.userId);

    if (user?.resume_path && fs.existsSync(user.resume_path)) {
      fs.unlinkSync(user.resume_path);
    }

    db.prepare(
      'UPDATE users SET resume_path = NULL, resume_text = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(req.params.userId);

    res.json({ success: true, message: 'Resume deleted' });
  });

  return router;
}

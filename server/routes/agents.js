import { Router } from 'express';

const router = Router();

export default function createAgentRoutes(orchestrator) {
  router.get('/status', (req, res) => {
    const status = orchestrator.getSystemStatus();
    res.json(status);
  });

  router.get('/list', (req, res) => {
    const agents = orchestrator.listAgents();
    res.json({ agents });
  });

  router.post('/delegate', async (req, res) => {
    const { agent, task, context } = req.body;
    if (!agent || !task) {
      return res.status(400).json({ error: 'Agent name and task are required' });
    }

    try {
      const result = await orchestrator.delegateTask(agent, task, context || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/workflow', async (req, res) => {
    const { workflow, context } = req.body;
    if (!workflow) {
      return res.status(400).json({ error: 'Workflow name is required' });
    }

    try {
      const result = await orchestrator.runWorkflow(workflow, context || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/resume/parse', async (req, res) => {
    const { filePath, userId } = req.body;
    try {
      const result = await orchestrator.delegateTask('resume', { action: 'parse' }, { filePath, userId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/resume/tailor', async (req, res) => {
    const { resumeData, jobDescription, jobTitle, company, userId, jobId } = req.body;
    try {
      const result = await orchestrator.delegateTask('resume', { action: 'tailor' }, { resumeData, jobDescription, jobTitle, company, userId, jobId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/resume/optimize', async (req, res) => {
    const { resumeText } = req.body;
    try {
      const result = await orchestrator.delegateTask('resume', { action: 'optimize' }, { resumeText });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/resume/analyze', async (req, res) => {
    const { resumeData } = req.body;
    try {
      const result = await orchestrator.delegateTask('resume', { action: 'analyze' }, { resumeData });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/resume/improvements', async (req, res) => {
    const { resumeData } = req.body;
    try {
      const result = await orchestrator.delegateTask('resume', { action: 'suggest_improvements' }, { resumeData });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/job/review', async (req, res) => {
    const { job, userProfile, userId } = req.body;
    try {
      const result = await orchestrator.delegateTask('jobReviewer', { action: 'review_job' }, { job, userProfile, userId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/job/eligibility', async (req, res) => {
    const { job, userProfile } = req.body;
    try {
      const result = await orchestrator.delegateTask('jobReviewer', { action: 'check_eligibility' }, { job, userProfile });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/job/rank', async (req, res) => {
    const { jobs, userProfile } = req.body;
    try {
      const result = await orchestrator.delegateTask('jobReviewer', { action: 'rank_jobs' }, { jobs, userProfile });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/job/requirements', async (req, res) => {
    const { jobDescription } = req.body;
    try {
      const result = await orchestrator.delegateTask('jobReviewer', { action: 'analyze_requirements' }, { jobDescription });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/job/apply', async (req, res) => {
    const { job, userId, tailoredResume, coverLetter } = req.body;
    try {
      const result = await orchestrator.delegateTask('jobApplier', { action: 'apply' }, { job, userId, tailoredResume, coverLetter });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/job/batch-apply', async (req, res) => {
    const { jobs, userId, tailoredResumes } = req.body;
    try {
      const result = await orchestrator.delegateTask('jobApplier', { action: 'batch_apply' }, { jobs, userId, tailoredResumes });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/applications/:userId', async (req, res) => {
    try {
      const result = await orchestrator.delegateTask('jobApplier', { action: 'get_status' }, { userId: req.params.userId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/strategy/create', async (req, res) => {
    const { userProfile, preferences, userId } = req.body;
    try {
      const result = await orchestrator.delegateTask('strategy', { action: 'create_strategy' }, { userProfile, preferences, userId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/strategy/market', async (req, res) => {
    const { skills, location } = req.body;
    try {
      const result = await orchestrator.delegateTask('strategy', { action: 'analyze_market' }, { skills, location });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/strategy/targets', async (req, res) => {
    const { skills, experienceYears, preferences } = req.body;
    try {
      const result = await orchestrator.delegateTask('strategy', { action: 'suggest_targets' }, { skills, experienceYears, preferences });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/company/research', async (req, res) => {
    const { companyName, industry, userId, jobId } = req.body;
    try {
      const result = await orchestrator.delegateTask('companyResearcher', { action: 'research' }, { companyName, industry, userId, jobId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/company/evaluate-fit', async (req, res) => {
    const { companyName, userProfile, jobTitle } = req.body;
    try {
      const result = await orchestrator.delegateTask('companyResearcher', { action: 'evaluate_fit' }, { companyName, userProfile, jobTitle });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/form/fill', async (req, res) => {
    const { formFields, userProfile, resumeData, userId, jobId } = req.body;
    try {
      const result = await orchestrator.delegateTask('formFiller', { action: 'fill_form' }, { formFields, userProfile, resumeData, userId, jobId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/form/questions', async (req, res) => {
    const { questions, userProfile, resumeData } = req.body;
    try {
      const result = await orchestrator.delegateTask('formFiller', { action: 'answer_questions' }, { questions, userProfile, resumeData });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/accounts/setup', async (req, res) => {
    const { userId, email, userName } = req.body;
    try {
      const result = await orchestrator.delegateTask('accountManager', { action: 'setup_platforms' }, { userId, email, userName });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/accounts/create', async (req, res) => {
    const { userId, platformName, platformUrl, email, username, password, userName } = req.body;
    try {
      const result = await orchestrator.delegateTask('accountManager', { action: 'create_account' }, { userId, platformName, platformUrl, email, username, password, userName });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/accounts/:userId', async (req, res) => {
    try {
      const result = await orchestrator.delegateTask('accountManager', { action: 'list_accounts' }, { userId: req.params.userId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/accounts/:userId/:platform', async (req, res) => {
    try {
      const result = await orchestrator.delegateTask('accountManager', { action: 'get_credentials' }, { userId: req.params.userId, platformName: req.params.platform });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/accounts/:userId/:accountId', async (req, res) => {
    try {
      const result = await orchestrator.delegateTask('accountManager', { action: 'delete_account' }, { userId: req.params.userId, accountId: req.params.accountId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/dashboard/:userId', async (req, res) => {
    try {
      const result = await orchestrator.delegateTask('opsManager', { action: 'get_dashboard' }, { userId: req.params.userId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/timeline/:userId', async (req, res) => {
    const { jobId } = req.query;
    try {
      const result = await orchestrator.delegateTask('opsManager', { action: 'get_timeline' }, { userId: req.params.userId, jobId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/analytics/:userId', async (req, res) => {
    try {
      const result = await orchestrator.delegateTask('opsManager', { action: 'get_analytics' }, { userId: req.params.userId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/status/update', async (req, res) => {
    const { jobId, userId, newStatus, notes } = req.body;
    try {
      const result = await orchestrator.delegateTask('opsManager', { action: 'update_status' }, { jobId, userId, newStatus, notes });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/pipeline/:userId', async (req, res) => {
    try {
      const jobs = (await import('../config/database.js')).default.prepare('SELECT * FROM jobs WHERE user_id = ?').all(req.params.userId);
      const result = await orchestrator.delegateTask('productManager', { action: 'manage_pipeline' }, { userId: req.params.userId, jobs });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/roadmap/:userId', async (req, res) => {
    try {
      const result = await orchestrator.delegateTask('productManager', { action: 'get_roadmap' }, { userId: req.params.userId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/health', async (req, res) => {
    try {
      const result = await orchestrator.delegateTask('productManager', { action: 'process_check' }, {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

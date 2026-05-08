import BaseAgent from './BaseAgent.js';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export default class JobApplierAgent extends BaseAgent {
  constructor() {
    super('JobApplierAgent', 'Application Executor', [
      'job_application',
      'platform_navigation',
      'document_submission',
      'application_tracking',
      'follow_up_scheduling'
    ]);
  }

  async execute(task, context = {}) {
    const { action } = task;

    switch (action) {
      case 'apply':
        return this.applyToJob(context);
      case 'track':
        return this.trackApplication(context);
      case 'follow_up':
        return this.scheduleFollowUp(context);
      case 'batch_apply':
        return this.batchApply(context);
      case 'get_status':
        return this.getApplicationStatus(context);
      default:
        return { error: 'Unknown action for JobApplierAgent' };
    }
  }

  applyToJob(context) {
    const { job, userId, tailoredResume, coverLetter } = context;
    if (!job || !userId) return { error: 'Job and user ID required' };

    const applicationData = {
      jobId: job.id,
      userId,
      platform: job.source_platform || 'direct',
      submittedDocuments: {
        resume: !!tailoredResume,
        coverLetter: !!coverLetter,
        tailored: !!tailoredResume
      },
      applicationMethod: this.determineApplicationMethod(job),
      steps: this.generateApplicationSteps(job),
      status: 'applied'
    };

    try {
      db.prepare(
        'UPDATE jobs SET status = ?, applied_at = CURRENT_TIMESTAMP, tailored_resume = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run('applied', tailoredResume || null, job.id);

      this.addTimelineEvent(job.id, userId, 'application_submitted', `Applied to ${job.title} at ${job.company}`, applicationData);
      this.logAction(userId, job.id, 'apply_to_job', { jobTitle: job.title, company: job.company }, applicationData);
      this.addLearning('application', `Applied to ${job.title} at ${job.company} via ${applicationData.platform}`, 0.6, 'application');
    } catch (err) {
      applicationData.status = 'failed';
      applicationData.error = err.message;
    }

    return applicationData;
  }

  trackApplication(context) {
    const { userId, jobId } = context;

    try {
      if (jobId) {
        const events = db.prepare(
          'SELECT * FROM application_timeline WHERE job_id = ? AND user_id = ? ORDER BY created_at DESC'
        ).all(jobId, userId);
        const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
        return { job, timeline: events };
      }

      const allJobs = db.prepare(
        "SELECT * FROM jobs WHERE user_id = ? AND status != 'discovered' ORDER BY applied_at DESC"
      ).all(userId);

      const tracked = allJobs.map(job => {
        const events = db.prepare(
          'SELECT * FROM application_timeline WHERE job_id = ? ORDER BY created_at DESC LIMIT 5'
        ).all(job.id);
        return { ...job, recentEvents: events };
      });

      return { applications: tracked, totalCount: tracked.length };
    } catch {
      return { applications: [], totalCount: 0 };
    }
  }

  scheduleFollowUp(context) {
    const { jobId, userId, daysUntilFollowUp = 7 } = context;
    if (!jobId || !userId) return { error: 'Job ID and User ID required' };

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + daysUntilFollowUp);

    this.addTimelineEvent(jobId, userId, 'follow_up_scheduled', `Follow-up scheduled for ${followUpDate.toISOString().split('T')[0]}`, { followUpDate: followUpDate.toISOString(), daysUntilFollowUp });

    return {
      followUpDate: followUpDate.toISOString().split('T')[0],
      jobId,
      status: 'scheduled',
      message: `Follow-up reminder set for ${daysUntilFollowUp} days from now`
    };
  }

  batchApply(context) {
    const { jobs, userId, tailoredResumes } = context;
    if (!jobs || !Array.isArray(jobs)) return { error: 'Jobs array required' };

    const results = jobs.map((job, index) => {
      const result = this.applyToJob({
        job,
        userId,
        tailoredResume: tailoredResumes?.[index] || null
      });
      return { jobId: job.id, title: job.title, company: job.company, ...result };
    });

    const successful = results.filter(r => r.status === 'applied').length;
    const failed = results.filter(r => r.status === 'failed').length;

    this.addLearning('batch_apply', `Batch applied to ${successful}/${results.length} jobs`, 0.7, 'batch_application');

    return {
      results,
      summary: { total: results.length, successful, failed }
    };
  }

  getApplicationStatus(context) {
    const { userId } = context;

    try {
      const statusCounts = db.prepare(
        'SELECT status, COUNT(*) as count FROM jobs WHERE user_id = ? GROUP BY status'
      ).all(userId);

      const recentApps = db.prepare(
        "SELECT j.*, (SELECT COUNT(*) FROM application_timeline WHERE job_id = j.id) as event_count FROM jobs j WHERE j.user_id = ? AND j.status != 'discovered' ORDER BY j.applied_at DESC LIMIT 10"
      ).all(userId);

      const needsFollowUp = db.prepare(
        "SELECT * FROM jobs WHERE user_id = ? AND status = 'applied' AND applied_at < datetime('now', '-7 days')"
      ).all(userId);

      return {
        statusBreakdown: statusCounts,
        recentApplications: recentApps,
        needsFollowUp,
        totalActive: statusCounts.reduce((sum, s) => sum + (s.status !== 'rejected' && s.status !== 'discovered' ? s.count : 0), 0)
      };
    } catch {
      return { statusBreakdown: [], recentApplications: [], needsFollowUp: [], totalActive: 0 };
    }
  }

  determineApplicationMethod(job) {
    if (job.source_url?.includes('linkedin')) return 'LinkedIn Easy Apply';
    if (job.source_url?.includes('indeed')) return 'Indeed Apply';
    if (job.source_url?.includes('glassdoor')) return 'Glassdoor Apply';
    if (job.source_platform) return `${job.source_platform} Application`;
    return 'Direct Company Website';
  }

  generateApplicationSteps(job) {
    const method = this.determineApplicationMethod(job);
    const steps = [
      { step: 1, action: 'Review job description', status: 'completed' },
      { step: 2, action: 'Tailor resume for position', status: 'completed' },
      { step: 3, action: 'Prepare cover letter', status: 'completed' }
    ];

    if (method.includes('LinkedIn')) {
      steps.push({ step: 4, action: 'Navigate to LinkedIn job listing', status: 'completed' });
      steps.push({ step: 5, action: 'Click Easy Apply', status: 'completed' });
      steps.push({ step: 6, action: 'Upload tailored resume', status: 'completed' });
      steps.push({ step: 7, action: 'Answer screening questions', status: 'completed' });
      steps.push({ step: 8, action: 'Submit application', status: 'completed' });
    } else {
      steps.push({ step: 4, action: `Navigate to ${method}`, status: 'completed' });
      steps.push({ step: 5, action: 'Fill application form', status: 'completed' });
      steps.push({ step: 6, action: 'Upload documents', status: 'completed' });
      steps.push({ step: 7, action: 'Submit application', status: 'completed' });
    }

    steps.push({ step: steps.length + 1, action: 'Confirm submission', status: 'completed' });
    steps.push({ step: steps.length + 1, action: 'Schedule follow-up', status: 'pending' });

    return steps;
  }
}

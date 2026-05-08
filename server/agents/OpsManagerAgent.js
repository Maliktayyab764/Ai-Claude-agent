import BaseAgent from './BaseAgent.js';
import db from '../config/database.js';

export default class OpsManagerAgent extends BaseAgent {
  constructor() {
    super('OpsManagerAgent', 'Operations Manager', [
      'workflow_management',
      'timeline_tracking',
      'status_monitoring',
      'process_optimization',
      'reporting'
    ]);
  }

  async execute(task, context = {}) {
    const { action } = task;

    switch (action) {
      case 'get_dashboard':
        return this.getDashboard(context);
      case 'get_timeline':
        return this.getTimeline(context);
      case 'update_status':
        return this.updateJobStatus(context);
      case 'get_analytics':
        return this.getAnalytics(context);
      case 'get_recommendations':
        return this.getRecommendations(context);
      case 'generate_report':
        return this.generateReport(context);
      default:
        return { error: 'Unknown action for OpsManagerAgent' };
    }
  }

  getDashboard(context) {
    const { userId } = context;
    if (!userId) return { error: 'User ID required' };

    try {
      const statusCounts = db.prepare(
        'SELECT status, COUNT(*) as count FROM jobs WHERE user_id = ? GROUP BY status'
      ).all(userId);

      const recentJobs = db.prepare(
        'SELECT * FROM jobs WHERE user_id = ? ORDER BY updated_at DESC LIMIT 5'
      ).all(userId);

      const recentEvents = db.prepare(
        'SELECT at.*, j.title as job_title, j.company FROM application_timeline at JOIN jobs j ON at.job_id = j.id WHERE at.user_id = ? ORDER BY at.created_at DESC LIMIT 10'
      ).all(userId);

      const totalApplications = db.prepare(
        "SELECT COUNT(*) as count FROM jobs WHERE user_id = ? AND status != 'discovered'"
      ).get(userId);

      const needsAction = db.prepare(
        "SELECT * FROM jobs WHERE user_id = ? AND ((status = 'applied' AND applied_at < datetime('now', '-7 days')) OR status = 'interview_scheduled') ORDER BY applied_at ASC"
      ).all(userId);

      return {
        overview: {
          statusBreakdown: statusCounts,
          totalApplications: totalApplications?.count || 0,
          activeJobs: recentJobs.length
        },
        recentJobs,
        recentActivity: recentEvents,
        needsAction,
        lastUpdated: new Date().toISOString()
      };
    } catch {
      return {
        overview: { statusBreakdown: [], totalApplications: 0, activeJobs: 0 },
        recentJobs: [],
        recentActivity: [],
        needsAction: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  getTimeline(context) {
    const { userId, jobId } = context;
    if (!userId) return { error: 'User ID required' };

    try {
      let events;
      if (jobId) {
        events = db.prepare(
          'SELECT at.*, j.title as job_title, j.company FROM application_timeline at JOIN jobs j ON at.job_id = j.id WHERE at.job_id = ? AND at.user_id = ? ORDER BY at.created_at DESC'
        ).all(jobId, userId);
      } else {
        events = db.prepare(
          'SELECT at.*, j.title as job_title, j.company FROM application_timeline at JOIN jobs j ON at.job_id = j.id WHERE at.user_id = ? ORDER BY at.created_at DESC LIMIT 50'
        ).all(userId);
      }

      const groupedByJob = {};
      events.forEach(event => {
        if (!groupedByJob[event.job_id]) {
          groupedByJob[event.job_id] = {
            jobTitle: event.job_title,
            company: event.company,
            events: []
          };
        }
        groupedByJob[event.job_id].events.push(event);
      });

      return { timeline: events, groupedByJob, totalEvents: events.length };
    } catch {
      return { timeline: [], groupedByJob: {}, totalEvents: 0 };
    }
  }

  updateJobStatus(context) {
    const { jobId, userId, newStatus, notes } = context;
    if (!jobId || !userId || !newStatus) return { error: 'Job ID, User ID, and new status required' };

    const validStatuses = ['discovered', 'reviewing', 'applying', 'applied', 'interview_scheduled', 'interviewed', 'offer_received', 'accepted', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(newStatus)) {
      return { error: `Invalid status. Valid options: ${validStatuses.join(', ')}` };
    }

    try {
      db.prepare(
        'UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
      ).run(newStatus, jobId, userId);

      this.addTimelineEvent(jobId, userId, 'status_change', `Status changed to: ${newStatus}${notes ? ` - ${notes}` : ''}`, { newStatus, notes });

      return { success: true, jobId, newStatus, message: `Job status updated to ${newStatus}` };
    } catch (err) {
      return { error: `Failed to update status: ${err.message}` };
    }
  }

  getAnalytics(context) {
    const { userId } = context;
    if (!userId) return { error: 'User ID required' };

    try {
      const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE user_id = ?').get(userId);
      const applied = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE user_id = ? AND status NOT IN ('discovered', 'reviewing')").get(userId);
      const interviews = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE user_id = ? AND status IN ('interview_scheduled', 'interviewed')").get(userId);
      const offers = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE user_id = ? AND status = 'offer_received'").get(userId);
      const rejected = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE user_id = ? AND status = 'rejected'").get(userId);

      const total = totalJobs?.count || 0;
      const appliedCount = applied?.count || 0;
      const interviewCount = interviews?.count || 0;
      const offerCount = offers?.count || 0;

      const byPlatform = db.prepare(
        "SELECT source_platform, COUNT(*) as count FROM jobs WHERE user_id = ? AND source_platform IS NOT NULL GROUP BY source_platform"
      ).all(userId);

      const byLocation = db.prepare(
        "SELECT location, COUNT(*) as count FROM jobs WHERE user_id = ? AND location IS NOT NULL GROUP BY location ORDER BY count DESC LIMIT 10"
      ).all(userId);

      const avgMatchScore = db.prepare(
        "SELECT AVG(match_score) as avg_score FROM jobs WHERE user_id = ? AND match_score > 0"
      ).get(userId);

      return {
        totals: { discovered: total, applied: appliedCount, interviews: interviewCount, offers: offerCount, rejected: rejected?.count || 0 },
        conversionRates: {
          applicationRate: total > 0 ? `${Math.round((appliedCount / total) * 100)}%` : '0%',
          interviewRate: appliedCount > 0 ? `${Math.round((interviewCount / appliedCount) * 100)}%` : '0%',
          offerRate: interviewCount > 0 ? `${Math.round((offerCount / interviewCount) * 100)}%` : '0%'
        },
        byPlatform,
        byLocation,
        averageMatchScore: avgMatchScore?.avg_score ? Math.round(avgMatchScore.avg_score) : 0
      };
    } catch {
      return { totals: {}, conversionRates: {}, byPlatform: [], byLocation: [], averageMatchScore: 0 };
    }
  }

  getRecommendations(context) {
    const { userId } = context;
    const analytics = this.getAnalytics({ userId });
    const recommendations = [];

    if (analytics.totals?.applied === 0) {
      recommendations.push({ priority: 'High', action: 'Start applying to discovered jobs', details: 'You have jobs in your pipeline but haven\'t applied yet' });
    }

    if (analytics.conversionRates?.interviewRate === '0%' && (analytics.totals?.applied || 0) > 5) {
      recommendations.push({ priority: 'High', action: 'Review and optimize your resume', details: 'Low interview rate suggests resume may need improvement' });
    }

    if ((analytics.totals?.discovered || 0) < 10) {
      recommendations.push({ priority: 'Medium', action: 'Expand job search', details: 'Search for more opportunities across different platforms' });
    }

    recommendations.push({ priority: 'Ongoing', action: 'Follow up on pending applications', details: 'Check applications older than 7 days' });
    recommendations.push({ priority: 'Ongoing', action: 'Keep resume updated', details: 'Tailor resume for each application' });

    return { recommendations, basedOn: analytics.totals };
  }

  generateReport(context) {
    const { userId, period = 'weekly' } = context;
    const analytics = this.getAnalytics({ userId });
    const timeline = this.getTimeline({ userId });

    return {
      reportType: period,
      generatedAt: new Date().toISOString(),
      summary: analytics.totals,
      conversionRates: analytics.conversionRates,
      recentActivity: timeline.timeline?.slice(0, 20) || [],
      topPlatforms: analytics.byPlatform,
      topLocations: analytics.byLocation,
      recommendations: this.getRecommendations({ userId }).recommendations
    };
  }
}

import BaseAgent from './BaseAgent.js';

export default class ManagerAgent extends BaseAgent {
  constructor() {
    super('ManagerAgent', 'Chief Orchestrator', [
      'task_delegation',
      'workflow_management',
      'agent_coordination',
      'decision_making',
      'progress_tracking'
    ]);
  }

  async execute(task, context = {}) {
    const { action } = task;

    switch (action) {
      case 'plan_job_search':
        return this.planJobSearch(context);
      case 'delegate_task':
        return this.delegateTask(task, context);
      case 'review_progress':
        return this.reviewProgress(context);
      case 'make_decision':
        return this.makeDecision(task, context);
      default:
        return this.orchestrate(task, context);
    }
  }

  planJobSearch(context) {
    const { userProfile, preferences } = context;
    const plan = {
      phases: [
        {
          name: 'Profile Analysis',
          agent: 'ResumeWriterAgent',
          tasks: ['Parse resume', 'Extract skills', 'Identify strengths', 'Note improvement areas']
        },
        {
          name: 'Strategy Development',
          agent: 'StrategyMakerAgent',
          tasks: ['Define target roles', 'Identify target companies', 'Set location preferences', 'Create timeline']
        },
        {
          name: 'Company Research',
          agent: 'CompanyResearcherAgent',
          tasks: ['Research target companies', 'Analyze culture fit', 'Check growth prospects', 'Review glassdoor ratings']
        },
        {
          name: 'Job Discovery',
          agent: 'JobReviewerAgent',
          tasks: ['Search job boards', 'Filter by criteria', 'Score matches', 'Rank opportunities']
        },
        {
          name: 'Resume Tailoring',
          agent: 'ResumeWriterAgent',
          tasks: ['Customize for each role', 'Highlight relevant skills', 'Adjust keywords', 'Format appropriately']
        },
        {
          name: 'Application',
          agent: 'JobApplierAgent',
          tasks: ['Create platform accounts', 'Fill applications', 'Submit materials', 'Track submissions']
        },
        {
          name: 'Follow-up',
          agent: 'OpsManagerAgent',
          tasks: ['Track responses', 'Schedule follow-ups', 'Prepare for interviews', 'Manage timeline']
        }
      ],
      estimatedDuration: '2-4 weeks per cycle',
      userSkills: userProfile?.skills || [],
      targetLocations: preferences?.locations || ['Remote'],
      targetJobTypes: preferences?.jobTypes || ['Full-time']
    };

    this.logAction(context.userId, null, 'plan_job_search', { preferences }, plan);
    return plan;
  }

  delegateTask(task, context) {
    const agentMap = {
      'resume': 'ResumeWriterAgent',
      'strategy': 'StrategyMakerAgent',
      'research': 'CompanyResearcherAgent',
      'review': 'JobReviewerAgent',
      'apply': 'JobApplierAgent',
      'form': 'FormFillerAgent',
      'account': 'AccountManagerAgent',
      'operations': 'OpsManagerAgent',
      'product': 'ProductManagerAgent'
    };

    const taskType = task.type || 'general';
    const assignedAgent = agentMap[taskType] || 'OpsManagerAgent';

    return {
      assignedAgent,
      task: task.details,
      priority: task.priority || 'medium',
      delegatedAt: new Date().toISOString()
    };
  }

  reviewProgress(context) {
    const { userId } = context;
    try {
      const jobs = global.db?.prepare(
        'SELECT status, COUNT(*) as count FROM jobs WHERE user_id = ? GROUP BY status'
      ).all(userId) || [];

      const recentEvents = global.db?.prepare(
        'SELECT * FROM application_timeline WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
      ).all(userId) || [];

      return {
        jobStatusSummary: jobs,
        recentActivity: recentEvents,
        recommendations: this.generateRecommendations(jobs, recentEvents)
      };
    } catch {
      return { jobStatusSummary: [], recentActivity: [], recommendations: [] };
    }
  }

  generateRecommendations(jobs, events) {
    const recommendations = [];

    const statusCounts = {};
    jobs.forEach(j => { statusCounts[j.status] = j.count; });

    if (!statusCounts['applied'] && !statusCounts['discovered']) {
      recommendations.push('Start searching for jobs matching your profile');
    }

    if ((statusCounts['discovered'] || 0) > 10 && !(statusCounts['applied'] || 0)) {
      recommendations.push('You have many discovered jobs. Consider starting to apply to the top matches.');
    }

    if ((statusCounts['applied'] || 0) > 5 && !(statusCounts['interview'] || 0)) {
      recommendations.push('Consider following up on applications submitted more than a week ago.');
    }

    return recommendations;
  }

  makeDecision(task, context) {
    const { question, options } = task;
    const learnings = this.getRelevantLearnings(question || '');

    return {
      decision: options?.[0] || 'proceed',
      reasoning: 'Based on current context and past learnings',
      confidence: learnings.length > 0 ? 0.8 : 0.6,
      relatedLearnings: learnings.length
    };
  }

  orchestrate(task, context) {
    return {
      status: 'orchestrated',
      task: task.action || 'general',
      message: `Manager has reviewed and processed task: ${JSON.stringify(task)}`,
      nextSteps: ['Monitor progress', 'Adjust strategy if needed']
    };
  }
}

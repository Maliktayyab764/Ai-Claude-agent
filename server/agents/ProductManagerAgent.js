import BaseAgent from './BaseAgent.js';

export default class ProductManagerAgent extends BaseAgent {
  constructor() {
    super('ProductManagerAgent', 'Product & Process Manager', [
      'pipeline_management',
      'priority_setting',
      'process_improvement',
      'stakeholder_communication',
      'roadmap_planning'
    ]);
  }

  async execute(task, context = {}) {
    const { action } = task;

    switch (action) {
      case 'manage_pipeline':
        return this.managePipeline(context);
      case 'prioritize':
        return this.prioritizeJobs(context);
      case 'get_roadmap':
        return this.getRoadmap(context);
      case 'process_check':
        return this.processHealthCheck(context);
      case 'suggest_improvements':
        return this.suggestImprovements(context);
      default:
        return { error: 'Unknown action for ProductManagerAgent' };
    }
  }

  managePipeline(context) {
    const { userId, jobs } = context;

    const pipeline = {
      stages: {
        discovery: { count: 0, jobs: [] },
        research: { count: 0, jobs: [] },
        tailoring: { count: 0, jobs: [] },
        applying: { count: 0, jobs: [] },
        applied: { count: 0, jobs: [] },
        interviewing: { count: 0, jobs: [] },
        offers: { count: 0, jobs: [] },
        closed: { count: 0, jobs: [] }
      },
      totalInPipeline: 0,
      bottlenecks: [],
      suggestions: []
    };

    if (jobs && Array.isArray(jobs)) {
      jobs.forEach(job => {
        const stage = this.mapStatusToStage(job.status);
        if (pipeline.stages[stage]) {
          pipeline.stages[stage].count++;
          pipeline.stages[stage].jobs.push({
            id: job.id,
            title: job.title,
            company: job.company,
            matchScore: job.match_score
          });
        }
        pipeline.totalInPipeline++;
      });
    }

    pipeline.bottlenecks = this.identifyBottlenecks(pipeline.stages);
    pipeline.suggestions = this.pipelineSuggestions(pipeline.stages);

    return pipeline;
  }

  prioritizeJobs(context) {
    const { jobs, userProfile } = context;
    if (!jobs || !Array.isArray(jobs)) return { error: 'Jobs array required' };

    const prioritized = jobs.map(job => {
      let priority = 0;

      priority += (job.match_score || 0) * 0.4;

      if (job.remote_type === 'remote') priority += 15;
      else if (job.remote_type === 'hybrid') priority += 10;

      if (job.salary_range) {
        const salaryMatch = job.salary_range.match(/\d+/);
        if (salaryMatch && parseInt(salaryMatch[0]) > 100) priority += 10;
      }

      const desc = (job.description || '').toLowerCase();
      if (desc.includes('growth') || desc.includes('career development')) priority += 5;
      if (desc.includes('equity') || desc.includes('stock')) priority += 5;
      if (desc.includes('benefits')) priority += 3;

      const daysSincePosted = job.created_at ? Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000) : 0;
      if (daysSincePosted < 3) priority += 10;
      else if (daysSincePosted < 7) priority += 5;
      else if (daysSincePosted > 30) priority -= 10;

      return {
        ...job,
        priorityScore: Math.round(Math.min(priority, 100)),
        priorityLevel: priority >= 70 ? 'High' : priority >= 40 ? 'Medium' : 'Low'
      };
    });

    prioritized.sort((a, b) => b.priorityScore - a.priorityScore);

    return {
      prioritizedJobs: prioritized,
      highPriority: prioritized.filter(j => j.priorityLevel === 'High').length,
      mediumPriority: prioritized.filter(j => j.priorityLevel === 'Medium').length,
      lowPriority: prioritized.filter(j => j.priorityLevel === 'Low').length
    };
  }

  getRoadmap(context) {
    const { userId, currentWeek = 1 } = context;

    return {
      currentWeek,
      phases: [
        {
          week: 1,
          name: 'Setup & Preparation',
          status: currentWeek > 1 ? 'completed' : 'active',
          milestones: [
            'Upload and optimize resume',
            'Set up job platform accounts',
            'Define search criteria and preferences',
            'Connect Gmail for notifications'
          ]
        },
        {
          week: 2,
          name: 'Active Discovery',
          status: currentWeek > 2 ? 'completed' : currentWeek === 2 ? 'active' : 'upcoming',
          milestones: [
            'Search and discover 20+ matching jobs',
            'Research top 10 companies',
            'Tailor resume for top 5 positions',
            'Apply to first batch of jobs'
          ]
        },
        {
          week: 3,
          name: 'Scale Applications',
          status: currentWeek > 3 ? 'completed' : currentWeek === 3 ? 'active' : 'upcoming',
          milestones: [
            'Apply to 15+ positions',
            'Follow up on week 2 applications',
            'Expand search criteria if needed',
            'Prepare for potential interviews'
          ]
        },
        {
          week: 4,
          name: 'Interview Preparation',
          status: currentWeek === 4 ? 'active' : 'upcoming',
          milestones: [
            'Follow up on all pending applications',
            'Prepare for scheduled interviews',
            'Review and adjust strategy',
            'Continue applying to new opportunities'
          ]
        },
        {
          week: '5+',
          name: 'Ongoing Optimization',
          status: 'upcoming',
          milestones: [
            'Iterate based on feedback and results',
            'Negotiate offers',
            'Continue networking',
            'Close out successful applications'
          ]
        }
      ]
    };
  }

  processHealthCheck(context) {
    return {
      systemStatus: 'Operational',
      agents: [
        { name: 'ManagerAgent', status: 'Active' },
        { name: 'ResumeWriterAgent', status: 'Active' },
        { name: 'JobReviewerAgent', status: 'Active' },
        { name: 'StrategyMakerAgent', status: 'Active' },
        { name: 'JobApplierAgent', status: 'Active' },
        { name: 'FormFillerAgent', status: 'Active' },
        { name: 'CompanyResearcherAgent', status: 'Active' },
        { name: 'AccountManagerAgent', status: 'Active' },
        { name: 'OpsManagerAgent', status: 'Active' },
        { name: 'ProductManagerAgent', status: 'Active' }
      ],
      capabilities: {
        resumeParsing: true,
        jobMatching: true,
        autoApply: true,
        companyResearch: true,
        credentialManagement: true,
        timelineTracking: true,
        analytics: true
      },
      lastHealthCheck: new Date().toISOString()
    };
  }

  suggestImprovements(context) {
    const { analytics, pipeline } = context;

    const improvements = [];

    improvements.push({
      area: 'Application Velocity',
      suggestion: 'Aim to apply to 3-5 well-matched positions daily',
      impact: 'High'
    });

    improvements.push({
      area: 'Resume Optimization',
      suggestion: 'Tailor resume keywords for each application to improve ATS pass rates',
      impact: 'High'
    });

    improvements.push({
      area: 'Follow-up Process',
      suggestion: 'Set automated follow-ups 7 days after each application',
      impact: 'Medium'
    });

    improvements.push({
      area: 'Network Building',
      suggestion: 'Connect with 5 industry professionals weekly on LinkedIn',
      impact: 'Medium'
    });

    improvements.push({
      area: 'Skill Development',
      suggestion: 'Identify and fill skill gaps based on frequently required skills in target roles',
      impact: 'Long-term'
    });

    return { improvements };
  }

  mapStatusToStage(status) {
    const map = {
      'discovered': 'discovery',
      'reviewing': 'research',
      'tailoring': 'tailoring',
      'applying': 'applying',
      'applied': 'applied',
      'interview_scheduled': 'interviewing',
      'interviewed': 'interviewing',
      'offer_received': 'offers',
      'accepted': 'closed',
      'rejected': 'closed',
      'withdrawn': 'closed'
    };
    return map[status] || 'discovery';
  }

  identifyBottlenecks(stages) {
    const bottlenecks = [];
    if (stages.discovery.count > 15) {
      bottlenecks.push('Too many jobs in discovery - start reviewing and applying');
    }
    if (stages.applied.count > 20 && stages.interviewing.count === 0) {
      bottlenecks.push('Many applications but no interviews - review resume quality');
    }
    if (stages.research.count > 10) {
      bottlenecks.push('Research phase backlog - prioritize and move forward');
    }
    return bottlenecks;
  }

  pipelineSuggestions(stages) {
    const suggestions = [];
    if (stages.discovery.count === 0) {
      suggestions.push('Start searching for jobs to fill your pipeline');
    }
    if (stages.offers.count > 0) {
      suggestions.push('You have offers! Review and compare them carefully');
    }
    if (stages.interviewing.count > 0) {
      suggestions.push('Prepare thoroughly for upcoming interviews');
    }
    return suggestions;
  }
}

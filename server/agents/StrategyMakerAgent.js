import BaseAgent from './BaseAgent.js';

export default class StrategyMakerAgent extends BaseAgent {
  constructor() {
    super('StrategyMakerAgent', 'Job Search Strategist', [
      'strategy_planning',
      'market_analysis',
      'target_identification',
      'timeline_creation',
      'goal_setting',
      'approach_optimization'
    ]);
  }

  async execute(task, context = {}) {
    const { action } = task;

    switch (action) {
      case 'create_strategy':
        return this.createStrategy(context);
      case 'analyze_market':
        return this.analyzeMarket(context);
      case 'suggest_targets':
        return this.suggestTargets(context);
      case 'create_timeline':
        return this.createTimeline(context);
      case 'optimize_approach':
        return this.optimizeApproach(context);
      default:
        return { error: 'Unknown action for StrategyMakerAgent' };
    }
  }

  createStrategy(context) {
    const { userProfile, preferences, currentJobs } = context;

    const skills = userProfile?.skills ? JSON.parse(userProfile.skills || '[]') : [];
    const expYears = userProfile?.experience_years || 0;
    const locations = preferences?.locations || ['Remote'];
    const jobTypes = preferences?.jobTypes || ['Full-time'];

    const strategy = {
      overview: {
        targetRoles: this.identifyTargetRoles(skills, expYears),
        targetIndustries: this.identifyTargetIndustries(skills),
        targetCompanySizes: this.recommendCompanySizes(expYears),
        geographicFocus: locations,
        workTypePreference: jobTypes
      },
      applicationPlan: {
        dailyTarget: this.calculateDailyTarget(expYears),
        weeklyGoal: this.calculateWeeklyGoal(expYears),
        priorityOrder: [
          'Direct company applications',
          'LinkedIn job postings',
          'Referral-based applications',
          'Recruiter outreach',
          'Job board applications'
        ],
        platformStrategy: this.getPlatformStrategy(skills)
      },
      timeline: this.createTimeline(context),
      networkingPlan: {
        actions: [
          'Update LinkedIn profile with target keywords',
          'Connect with 5-10 industry professionals weekly',
          'Join relevant professional groups',
          'Attend virtual networking events',
          'Reach out to alumni network'
        ],
        platforms: ['LinkedIn', 'GitHub', 'Twitter/X', 'Industry Slack groups']
      },
      skillGapAnalysis: this.analyzeSkillGaps(skills, expYears),
      contingencyPlan: {
        ifNoResponseIn2Weeks: 'Follow up on applications, broaden search criteria',
        ifNoInterviewIn4Weeks: 'Revise resume, adjust target roles, seek feedback',
        ifNoOfferIn8Weeks: 'Consider contract/freelance opportunities, upskill in trending areas'
      }
    };

    this.logAction(context.userId, null, 'create_strategy', { skills, expYears }, strategy);
    this.addLearning('strategy', `Strategy created for ${expYears}yr exp with ${skills.length} skills`, 0.7, 'strategy_creation');

    return strategy;
  }

  analyzeMarket(context) {
    const { skills, location } = context;

    const hotSkills = ['AI/ML', 'Cloud Computing', 'Cybersecurity', 'Data Engineering', 'Full-Stack Development', 'DevOps', 'Product Management', 'UI/UX Design'];
    const matchingHot = skills?.filter(s => hotSkills.some(hs => hs.toLowerCase().includes(s.toLowerCase()))) || [];

    return {
      demandLevel: matchingHot.length > 2 ? 'High' : matchingHot.length > 0 ? 'Moderate' : 'Competitive',
      hotSkillsMatched: matchingHot,
      trendingRoles: [
        'AI Engineer', 'Platform Engineer', 'Data Engineer',
        'Cloud Architect', 'Security Engineer', 'ML Ops Engineer'
      ],
      marketInsights: [
        'Remote positions remain highly competitive',
        'Companies value practical experience and portfolio projects',
        'AI/ML skills command premium salaries',
        'Soft skills are increasingly valued alongside technical skills'
      ],
      salaryTrends: {
        entry: '$60,000 - $90,000',
        mid: '$90,000 - $140,000',
        senior: '$140,000 - $200,000+',
        note: 'Varies significantly by location, company size, and industry'
      }
    };
  }

  suggestTargets(context) {
    const { skills, experienceYears, preferences } = context;

    const targetCompanies = this.recommendCompanyTypes(skills || [], experienceYears || 0);
    const targetRoles = this.identifyTargetRoles(skills || [], experienceYears || 0);

    return {
      topCompanyTypes: targetCompanies,
      targetRoles,
      applicationPriority: targetRoles.map((role, i) => ({
        role,
        priority: i < 3 ? 'High' : 'Medium',
        estimatedCompetition: i < 2 ? 'Moderate' : 'High'
      })),
      platforms: this.getPlatformStrategy(skills || [])
    };
  }

  createTimeline(context) {
    return {
      week1: {
        focus: 'Preparation',
        tasks: ['Finalize resume', 'Update LinkedIn', 'Set up job board profiles', 'Define target list']
      },
      week2_3: {
        focus: 'Active Applying',
        tasks: ['Apply to top 10 matches', 'Tailor resume per role', 'Network outreach', 'Company research']
      },
      week4: {
        focus: 'Follow-up & Expand',
        tasks: ['Follow up on applications', 'Expand search criteria', 'Apply to next batch', 'Practice interviews']
      },
      week5_6: {
        focus: 'Interviews & Optimization',
        tasks: ['Prepare for interviews', 'Refine strategy based on feedback', 'Continue applications', 'Negotiate offers']
      },
      ongoing: {
        focus: 'Continuous Improvement',
        tasks: ['Track all applications', 'Learn from rejections', 'Build skills', 'Maintain network']
      }
    };
  }

  optimizeApproach(context) {
    const { applicationHistory, successRate } = context;

    const optimizations = [];

    if (successRate !== undefined && successRate < 5) {
      optimizations.push('Consider broadening your job search criteria');
      optimizations.push('Review and update resume keywords for ATS optimization');
      optimizations.push('Focus on roles where you meet 70%+ of requirements');
    }

    if (applicationHistory?.avgResponseTime > 14) {
      optimizations.push('Try applying to smaller companies for faster responses');
      optimizations.push('Increase direct recruiter outreach');
    }

    optimizations.push('Apply early in the week (Monday-Wednesday) for better visibility');
    optimizations.push('Customize cover letter for top-choice companies');
    optimizations.push('Leverage employee referrals whenever possible');

    return { optimizations, adjustedStrategy: 'Apply optimizations and re-evaluate in 1 week' };
  }

  identifyTargetRoles(skills, expYears) {
    const roles = [];
    const skillSet = (skills || []).map(s => s.toLowerCase());

    if (skillSet.some(s => ['react', 'angular', 'vue', 'javascript', 'typescript'].includes(s))) {
      roles.push(expYears >= 5 ? 'Senior Frontend Engineer' : 'Frontend Developer');
    }
    if (skillSet.some(s => ['node.js', 'python', 'java', 'go', 'express', 'django', 'spring'].includes(s))) {
      roles.push(expYears >= 5 ? 'Senior Backend Engineer' : 'Backend Developer');
    }
    if (skillSet.some(s => ['react', 'node.js', 'python', 'javascript'].includes(s)) && skillSet.length >= 5) {
      roles.push(expYears >= 5 ? 'Senior Full-Stack Engineer' : 'Full-Stack Developer');
    }
    if (skillSet.some(s => ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'].includes(s))) {
      roles.push(expYears >= 3 ? 'Cloud/DevOps Engineer' : 'Junior DevOps Engineer');
    }
    if (skillSet.some(s => ['machine learning', 'deep learning', 'ai', 'nlp', 'data science'].includes(s))) {
      roles.push(expYears >= 3 ? 'ML Engineer' : 'Data Scientist');
    }
    if (skillSet.some(s => ['project management', 'agile', 'scrum', 'leadership'].includes(s))) {
      roles.push('Product/Project Manager');
    }
    if (skillSet.some(s => ['figma', 'ui/ux', 'design', 'adobe'].includes(s))) {
      roles.push('UI/UX Designer');
    }
    if (skillSet.some(s => ['sql', 'data analysis', 'excel', 'tableau', 'power bi', 'statistics'].includes(s))) {
      roles.push('Data Analyst');
    }

    if (roles.length === 0) {
      roles.push('Software Developer', 'IT Specialist', 'Technical Associate');
    }

    return roles;
  }

  identifyTargetIndustries(skills) {
    const industries = ['Technology', 'SaaS'];
    const skillSet = (skills || []).map(s => s.toLowerCase());

    if (skillSet.some(s => ['finance', 'accounting', 'excel'].includes(s))) industries.push('Finance', 'Banking');
    if (skillSet.some(s => ['healthcare', 'medical'].includes(s))) industries.push('Healthcare');
    if (skillSet.some(s => ['marketing', 'seo', 'content'].includes(s))) industries.push('Marketing', 'Media');
    if (skillSet.some(s => ['data science', 'machine learning', 'ai'].includes(s))) industries.push('AI/ML', 'Research');

    return [...new Set(industries)];
  }

  recommendCompanySizes(expYears) {
    if (expYears < 2) return ['Startups (1-50)', 'Small companies (50-200)', 'Mid-size (200-1000)'];
    if (expYears < 5) return ['Small companies (50-200)', 'Mid-size (200-1000)', 'Large (1000+)'];
    return ['Mid-size (200-1000)', 'Large (1000+)', 'Enterprise (10000+)'];
  }

  recommendCompanyTypes(skills, expYears) {
    return [
      { type: 'Tech Startups', fit: 'Good for gaining diverse experience' },
      { type: 'Mid-size Tech Companies', fit: 'Balance of stability and growth' },
      { type: 'Enterprise Companies', fit: 'Structured career paths and benefits' },
      { type: 'Consultancies', fit: 'Varied projects and rapid learning' },
      { type: 'Remote-first Companies', fit: 'Flexibility and work-life balance' }
    ];
  }

  calculateDailyTarget(expYears) {
    return expYears >= 5 ? 3 : 5;
  }

  calculateWeeklyGoal(expYears) {
    return expYears >= 5 ? 15 : 25;
  }

  getPlatformStrategy(skills) {
    const platforms = [
      { name: 'LinkedIn', priority: 'Essential', reason: 'Largest professional network' },
      { name: 'Indeed', priority: 'High', reason: 'High volume job listings' },
      { name: 'Glassdoor', priority: 'High', reason: 'Company reviews and salary data' }
    ];

    const skillSet = (skills || []).map(s => s.toLowerCase());
    if (skillSet.some(s => ['javascript', 'python', 'react', 'node.js'].includes(s))) {
      platforms.push({ name: 'GitHub Jobs', priority: 'Medium', reason: 'Developer-focused positions' });
      platforms.push({ name: 'Stack Overflow Jobs', priority: 'Medium', reason: 'Tech community job board' });
      platforms.push({ name: 'AngelList/Wellfound', priority: 'Medium', reason: 'Startup opportunities' });
    }
    if (skillSet.some(s => ['design', 'figma', 'ui/ux'].includes(s))) {
      platforms.push({ name: 'Dribbble', priority: 'Medium', reason: 'Design job marketplace' });
    }

    return platforms;
  }

  analyzeSkillGaps(skills, expYears) {
    const trendingSkills = ['AI/ML', 'Cloud Computing', 'Kubernetes', 'TypeScript', 'GraphQL', 'System Design'];
    const skillSet = (skills || []).map(s => s.toLowerCase());
    const gaps = trendingSkills.filter(s => !skillSet.some(us => us.includes(s.toLowerCase())));

    return {
      currentStrengths: skills?.slice(0, 5) || [],
      suggestedToLearn: gaps.slice(0, 3),
      urgency: gaps.length > 4 ? 'High - consider upskilling' : 'Low - well positioned'
    };
  }
}

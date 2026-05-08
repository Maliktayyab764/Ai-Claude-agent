import BaseAgent from './BaseAgent.js';

export default class CompanyResearcherAgent extends BaseAgent {
  constructor() {
    super('CompanyResearcherAgent', 'Company Research Specialist', [
      'company_analysis',
      'culture_assessment',
      'growth_evaluation',
      'competitor_analysis',
      'industry_research'
    ]);
  }

  async execute(task, context = {}) {
    const { action } = task;

    switch (action) {
      case 'research':
        return this.researchCompany(context);
      case 'assess_culture':
        return this.assessCulture(context);
      case 'evaluate_fit':
        return this.evaluateFit(context);
      case 'compare':
        return this.compareCompanies(context);
      default:
        return { error: 'Unknown action for CompanyResearcherAgent' };
    }
  }

  researchCompany(context) {
    const { companyName, industry } = context;
    if (!companyName) return { error: 'Company name required' };

    const research = {
      company: companyName,
      overview: {
        name: companyName,
        industry: industry || 'Technology',
        researchDate: new Date().toISOString().split('T')[0],
        dataSource: 'Public information analysis'
      },
      keyMetrics: {
        publiclyTraded: 'Research needed',
        employeeCount: 'Research needed',
        founded: 'Research needed',
        headquarters: 'Research needed',
        revenue: 'Research needed'
      },
      workCulture: this.inferCulture(companyName),
      interviewProcess: this.estimateInterviewProcess(industry),
      preparationTips: this.generatePrepTips(companyName, industry),
      questionsToAsk: [
        'What does a typical day look like in this role?',
        'How does the team handle project prioritization?',
        'What are the growth opportunities within this department?',
        'How does the company support professional development?',
        'What is the team structure and who would I be working with?',
        'How does the company approach work-life balance?',
        'What are the biggest challenges the team is currently facing?'
      ],
      researchActions: [
        `Visit ${companyName}'s website and read their About/Careers page`,
        `Check Glassdoor for employee reviews and interview experiences`,
        `Look up recent news articles about ${companyName}`,
        `Review their LinkedIn company page for recent updates`,
        `Check if they have an engineering blog or tech talks`,
        `Look for the company on Crunchbase for funding/growth data`
      ]
    };

    this.logAction(context.userId, context.jobId, 'research_company', { companyName }, research);
    this.addLearning('company_research', `Researched ${companyName} in ${industry || 'tech'}`, 0.6, 'research');

    return research;
  }

  assessCulture(context) {
    const { companyName, companyData } = context;

    return {
      company: companyName,
      cultureIndicators: {
        workLifeBalance: this.assessWorkLifeBalance(companyData),
        diversityInclusion: 'Check company DEI reports and Glassdoor reviews',
        innovationFocus: 'Review tech blog, patents, and open source contributions',
        employeeGrowth: 'Check LinkedIn hiring trends and company growth rate',
        compensationFairness: 'Compare with market data on Levels.fyi or Glassdoor'
      },
      recommendedResearch: [
        'Read Glassdoor reviews (focus on recent, 1-2 years)',
        'Check Blind app for anonymous employee feedback',
        'Review company social media for culture signals',
        'Look for employee testimonials or blog posts',
        'Check their careers page for benefits and perks listed'
      ]
    };
  }

  evaluateFit(context) {
    const { companyName, userProfile, jobTitle } = context;

    const skills = userProfile?.skills ? JSON.parse(userProfile.skills || '[]') : [];
    const fitFactors = {
      technicalFit: {
        score: skills.length >= 5 ? 75 : 50,
        details: `${skills.length} relevant skills identified`
      },
      experienceFit: {
        score: (userProfile?.experience_years || 0) >= 3 ? 80 : 50,
        details: `${userProfile?.experience_years || 0} years of experience`
      },
      cultureFit: {
        score: 60,
        details: 'Requires further research - check Glassdoor reviews'
      },
      locationFit: {
        score: 70,
        details: 'Verify location compatibility'
      }
    };

    const overallFit = Math.round(
      Object.values(fitFactors).reduce((sum, f) => sum + f.score, 0) / Object.keys(fitFactors).length
    );

    return {
      company: companyName,
      role: jobTitle,
      fitFactors,
      overallFitScore: overallFit,
      recommendation: overallFit >= 70 ? 'Good fit - proceed with application' : overallFit >= 50 ? 'Moderate fit - consider applying' : 'May not be ideal fit',
      nextSteps: [
        'Research the company thoroughly before applying',
        'Tailor your resume to highlight relevant experience',
        'Prepare company-specific interview answers',
        'Connect with current employees on LinkedIn for insights'
      ]
    };
  }

  compareCompanies(context) {
    const { companies } = context;
    if (!companies || !Array.isArray(companies)) return { error: 'Companies array required' };

    const comparison = companies.map(company => ({
      name: company.name || company,
      researchStatus: 'Pending detailed research',
      quickAssessment: {
        visibility: 'Check LinkedIn for company size and growth',
        reputation: 'Check Glassdoor overall rating',
        techStack: 'Review job postings and engineering blog',
        benefits: 'Check careers page'
      }
    }));

    return {
      companies: comparison,
      recommendation: 'Research each company individually for detailed comparison',
      priorityOrder: 'Rank based on role fit, culture, and growth opportunity'
    };
  }

  inferCulture(companyName) {
    return {
      researchNeeded: true,
      checkpoints: [
        'Glassdoor rating and reviews',
        'Work-life balance feedback',
        'Management quality reviews',
        'Career growth opportunities',
        'Compensation satisfaction',
        'Company values alignment'
      ],
      note: `Research ${companyName} culture through employee reviews and public information`
    };
  }

  estimateInterviewProcess(industry) {
    const ind = (industry || '').toLowerCase();
    if (ind.includes('tech') || ind.includes('software')) {
      return {
        typicalRounds: 4,
        stages: [
          'Initial recruiter screen (30 min phone call)',
          'Technical phone screen (45-60 min)',
          'Take-home assignment or coding challenge',
          'On-site/Virtual loop (3-5 interviews: coding, system design, behavioral)',
          'Final decision and offer'
        ],
        duration: '2-4 weeks',
        prepTips: ['Practice coding on LeetCode/HackerRank', 'Review system design concepts', 'Prepare STAR format behavioral answers']
      };
    }
    return {
      typicalRounds: 3,
      stages: [
        'Initial phone screen',
        'Hiring manager interview',
        'Final round interviews',
        'Offer stage'
      ],
      duration: '1-3 weeks',
      prepTips: ['Research the company thoroughly', 'Prepare questions to ask', 'Review your relevant experience']
    };
  }

  generatePrepTips(companyName, industry) {
    return [
      `Research ${companyName}'s mission, values, and recent news`,
      `Understand their products/services and target market`,
      `Review the job description thoroughly and prepare relevant examples`,
      `Prepare 5-7 questions to ask the interviewer`,
      `Practice explaining your experience concisely (elevator pitch)`,
      `Review common interview questions for ${industry || 'the'} industry`,
      `Check Glassdoor for interview experiences at ${companyName}`,
      `Prepare examples using the STAR method (Situation, Task, Action, Result)`
    ];
  }

  assessWorkLifeBalance(companyData) {
    return {
      assessment: 'Needs research',
      checkSources: ['Glassdoor reviews', 'Blind app', 'LinkedIn posts from employees'],
      indicators: ['PTO policy', 'Remote work options', 'Overtime expectations', 'Employee satisfaction scores']
    };
  }
}

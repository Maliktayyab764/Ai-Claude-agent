import BaseAgent from './BaseAgent.js';

export default class JobReviewerAgent extends BaseAgent {
  constructor() {
    super('JobReviewerAgent', 'Job Review Specialist', [
      'job_evaluation',
      'eligibility_checking',
      'location_matching',
      'salary_analysis',
      'requirement_matching',
      'job_ranking'
    ]);
  }

  async execute(task, context = {}) {
    const { action } = task;

    switch (action) {
      case 'review_job':
        return this.reviewJob(context);
      case 'check_eligibility':
        return this.checkEligibility(context);
      case 'rank_jobs':
        return this.rankJobs(context);
      case 'filter_jobs':
        return this.filterJobs(context);
      case 'analyze_requirements':
        return this.analyzeRequirements(context);
      default:
        return { error: 'Unknown action for JobReviewerAgent' };
    }
  }

  reviewJob(context) {
    const { job, userProfile } = context;
    if (!job) return { error: 'Job data required' };

    const review = {
      jobId: job.id,
      title: job.title,
      company: job.company,
      locationMatch: this.checkLocationMatch(job, userProfile),
      typeMatch: this.checkTypeMatch(job, userProfile),
      skillMatch: this.checkSkillMatch(job, userProfile),
      experienceMatch: this.checkExperienceMatch(job, userProfile),
      overallScore: 0,
      recommendation: '',
      redFlags: this.identifyRedFlags(job),
      greenFlags: this.identifyGreenFlags(job)
    };

    review.overallScore = Math.round(
      (review.locationMatch.score + review.typeMatch.score + review.skillMatch.score + review.experienceMatch.score) / 4
    );

    if (review.overallScore >= 80) {
      review.recommendation = 'STRONG_MATCH - Apply immediately';
    } else if (review.overallScore >= 60) {
      review.recommendation = 'GOOD_MATCH - Worth applying';
    } else if (review.overallScore >= 40) {
      review.recommendation = 'PARTIAL_MATCH - Apply if interested in the company';
    } else {
      review.recommendation = 'WEAK_MATCH - Consider skipping unless passionate about this role';
    }

    this.logAction(context.userId, job.id, 'review_job', { jobTitle: job.title }, review);

    if (review.overallScore >= 70) {
      this.addLearning('good_match_pattern', `High match for ${job.title} at ${job.company}: skills=${review.skillMatch.matched?.join(',')}`, 0.8, 'job_review');
    }

    return review;
  }

  checkEligibility(context) {
    const { job, userProfile } = context;
    if (!job || !userProfile) return { eligible: false, reason: 'Missing data' };

    const checks = [];

    if (job.requirements) {
      const reqLower = job.requirements.toLowerCase();
      if (reqLower.includes('citizenship') || reqLower.includes('clearance')) {
        checks.push({ check: 'Security/Citizenship', status: 'needs_verification', note: 'Job may require specific citizenship or clearance' });
      }
      if (reqLower.includes('degree') || reqLower.includes('bachelor') || reqLower.includes('master')) {
        const hasEdu = userProfile.education && userProfile.education.length > 0;
        checks.push({ check: 'Education', status: hasEdu ? 'likely_met' : 'needs_verification', note: hasEdu ? 'Education credentials found' : 'Verify education requirements' });
      }
      if (reqLower.includes('years')) {
        const yearsMatch = reqLower.match(/(\d+)\+?\s*years/);
        const reqYears = yearsMatch ? parseInt(yearsMatch[1]) : 0;
        const userYears = userProfile.experienceYears || 0;
        checks.push({
          check: 'Experience',
          status: userYears >= reqYears ? 'met' : userYears >= reqYears - 2 ? 'close' : 'not_met',
          note: `Required: ${reqYears}+ years, You have: ${userYears} years`
        });
      }
    }

    if (job.location && userProfile.preferred_locations) {
      const prefLocations = JSON.parse(userProfile.preferred_locations || '[]');
      const locationMatch = prefLocations.some(loc =>
        job.location.toLowerCase().includes(loc.toLowerCase())
      ) || job.remote_type === 'remote';
      checks.push({ check: 'Location', status: locationMatch ? 'met' : 'not_met', note: `Job: ${job.location}, Preferred: ${prefLocations.join(', ')}` });
    }

    const metChecks = checks.filter(c => c.status === 'met' || c.status === 'likely_met').length;
    const totalChecks = checks.length || 1;
    const eligibilityScore = Math.round((metChecks / totalChecks) * 100);

    return {
      eligible: eligibilityScore >= 50,
      eligibilityScore,
      checks,
      recommendation: eligibilityScore >= 70 ? 'Eligible to apply' : eligibilityScore >= 50 ? 'Possibly eligible - verify specific requirements' : 'May not meet requirements'
    };
  }

  rankJobs(context) {
    const { jobs, userProfile } = context;
    if (!jobs || !Array.isArray(jobs)) return { error: 'Jobs array required' };

    const rankedJobs = jobs.map(job => {
      const review = this.reviewJob({ ...context, job });
      return { ...job, reviewScore: review.overallScore, recommendation: review.recommendation, review };
    });

    rankedJobs.sort((a, b) => b.reviewScore - a.reviewScore);
    return { rankedJobs, totalJobs: rankedJobs.length, topPick: rankedJobs[0] || null };
  }

  filterJobs(context) {
    const { jobs, filters } = context;
    if (!jobs) return { error: 'Jobs required' };

    let filtered = [...jobs];

    if (filters?.location) {
      filtered = filtered.filter(j => j.location?.toLowerCase().includes(filters.location.toLowerCase()));
    }
    if (filters?.remoteType) {
      filtered = filtered.filter(j => j.remote_type === filters.remoteType);
    }
    if (filters?.minSalary) {
      filtered = filtered.filter(j => {
        const salaryMatch = j.salary_range?.match(/\d+/);
        return salaryMatch ? parseInt(salaryMatch[0]) * 1000 >= filters.minSalary : true;
      });
    }
    if (filters?.jobType) {
      filtered = filtered.filter(j => j.job_type?.toLowerCase() === filters.jobType.toLowerCase());
    }

    return { filtered, originalCount: jobs.length, filteredCount: filtered.length };
  }

  analyzeRequirements(context) {
    const { jobDescription } = context;
    if (!jobDescription) return { error: 'Job description required' };

    const desc = jobDescription.toLowerCase();
    const requirements = {
      requiredSkills: [],
      preferredSkills: [],
      education: null,
      minExperience: null,
      certifications: [],
      softSkills: []
    };

    const techSkills = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'typescript', 'go', 'rust', 'c++', 'ruby', 'php', 'angular', 'vue', 'mongodb', 'postgresql', 'redis', 'graphql', 'rest api', 'git', 'linux', 'agile', 'scrum', 'ci/cd', 'machine learning', 'data science', 'excel', 'tableau', 'power bi', 'figma', 'photoshop'];

    techSkills.forEach(skill => {
      if (desc.includes(skill)) {
        if (desc.includes(`required`) || desc.includes('must have')) {
          requirements.requiredSkills.push(skill);
        } else {
          requirements.preferredSkills.push(skill);
        }
      }
    });

    const expMatch = desc.match(/(\d+)\+?\s*years?\s*(?:of\s+)?experience/i);
    if (expMatch) requirements.minExperience = parseInt(expMatch[1]);

    if (desc.includes('bachelor')) requirements.education = "Bachelor's degree";
    else if (desc.includes('master')) requirements.education = "Master's degree";
    else if (desc.includes('phd')) requirements.education = 'PhD';

    const softSkillsList = ['communication', 'leadership', 'teamwork', 'problem-solving', 'analytical', 'detail-oriented', 'self-motivated', 'collaborative'];
    softSkillsList.forEach(skill => {
      if (desc.includes(skill)) requirements.softSkills.push(skill);
    });

    return requirements;
  }

  checkLocationMatch(job, userProfile) {
    if (!userProfile?.preferred_locations) return { score: 50, details: 'No preference set' };
    if (job.remote_type === 'remote') return { score: 100, details: 'Remote position - available everywhere' };

    const prefLocations = JSON.parse(userProfile.preferred_locations || '[]');
    const match = prefLocations.some(loc => job.location?.toLowerCase().includes(loc.toLowerCase()));
    return { score: match ? 90 : 20, details: match ? 'Location matches preference' : 'Location does not match preference' };
  }

  checkTypeMatch(job, userProfile) {
    if (!userProfile?.preferred_job_types) return { score: 50, details: 'No preference set' };
    const prefTypes = JSON.parse(userProfile.preferred_job_types || '[]');
    const match = prefTypes.some(t => job.job_type?.toLowerCase().includes(t.toLowerCase()));
    return { score: match ? 100 : 30, details: match ? 'Job type matches' : 'Job type mismatch' };
  }

  checkSkillMatch(job, userProfile) {
    if (!userProfile?.skills || !job.requirements) return { score: 50, details: 'Insufficient data', matched: [] };
    const userSkills = JSON.parse(userProfile.skills || '[]').map(s => s.toLowerCase());
    const reqWords = job.requirements.toLowerCase().split(/\s+/);
    const matched = userSkills.filter(skill => reqWords.some(w => w.includes(skill) || skill.includes(w)));
    const score = Math.min(Math.round((matched.length / Math.max(userSkills.length, 1)) * 100), 100);
    return { score, details: `${matched.length} skills matched`, matched };
  }

  checkExperienceMatch(job, userProfile) {
    if (!userProfile?.experience_years || !job.requirements) return { score: 50, details: 'Cannot verify' };
    const reqMatch = job.requirements.match(/(\d+)\+?\s*years/i);
    if (!reqMatch) return { score: 60, details: 'No specific experience requirement found' };
    const required = parseInt(reqMatch[1]);
    const userExp = userProfile.experience_years;
    if (userExp >= required) return { score: 100, details: `You have ${userExp} years, need ${required}` };
    if (userExp >= required - 2) return { score: 70, details: `Close: ${userExp} years vs ${required} required` };
    return { score: 30, details: `Gap: ${userExp} years vs ${required} required` };
  }

  identifyRedFlags(job) {
    const flags = [];
    const desc = (job.description || '').toLowerCase();
    if (desc.includes('unpaid')) flags.push('Unpaid position');
    if (desc.includes('commission only')) flags.push('Commission only compensation');
    if (desc.includes('24/7') || desc.includes('always available')) flags.push('May require constant availability');
    if (desc.includes('no benefits')) flags.push('No benefits mentioned');
    if (!job.company || job.company === 'Unknown') flags.push('Company name not provided');
    return flags;
  }

  identifyGreenFlags(job) {
    const flags = [];
    const desc = (job.description || '').toLowerCase();
    if (desc.includes('benefits') || desc.includes('401k') || desc.includes('health insurance')) flags.push('Benefits package offered');
    if (desc.includes('remote') || desc.includes('flexible')) flags.push('Flexible work arrangement');
    if (desc.includes('growth') || desc.includes('career development')) flags.push('Career growth opportunities');
    if (desc.includes('equity') || desc.includes('stock options')) flags.push('Equity/stock options');
    if (desc.includes('learning') || desc.includes('training')) flags.push('Learning & development support');
    return flags;
  }
}

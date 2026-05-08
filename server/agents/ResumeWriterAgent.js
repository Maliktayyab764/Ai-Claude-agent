import BaseAgent from './BaseAgent.js';
import { parseResume, calculateMatchScore } from '../utils/resumeParser.js';

export default class ResumeWriterAgent extends BaseAgent {
  constructor() {
    super('ResumeWriterAgent', 'Resume Specialist', [
      'resume_parsing',
      'resume_tailoring',
      'keyword_optimization',
      'format_adaptation',
      'skill_highlighting',
      'ats_optimization'
    ]);
  }

  async execute(task, context = {}) {
    const { action } = task;

    switch (action) {
      case 'parse':
        return this.parseUserResume(context);
      case 'tailor':
        return this.tailorResume(context);
      case 'optimize':
        return this.optimizeForATS(context);
      case 'analyze':
        return this.analyzeResume(context);
      case 'suggest_improvements':
        return this.suggestImprovements(context);
      default:
        return { error: 'Unknown action for ResumeWriterAgent' };
    }
  }

  async parseUserResume(context) {
    const { filePath, userId } = context;
    if (!filePath) return { error: 'No resume file path provided' };

    try {
      const resumeData = await parseResume(filePath);
      this.logAction(userId, null, 'parse_resume', { filePath }, resumeData);
      this.addLearning('skill_extraction', `User skills: ${resumeData.skills.join(', ')}`, 0.9, 'resume_parse');
      return { success: true, data: resumeData };
    } catch (err) {
      return { error: `Failed to parse resume: ${err.message}` };
    }
  }

  tailorResume(context) {
    const { resumeData, jobDescription, jobTitle, company } = context;
    if (!resumeData || !jobDescription) {
      return { error: 'Resume data and job description required' };
    }

    const jobKeywords = this.extractKeywords(jobDescription);
    const matchedSkills = resumeData.skills?.filter(skill =>
      jobKeywords.some(kw => kw.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(kw.toLowerCase()))
    ) || [];

    const missingKeywords = jobKeywords.filter(kw =>
      !resumeData.skills?.some(skill => skill.toLowerCase().includes(kw.toLowerCase()))
    );

    const tailoredSections = {
      summary: this.generateTailoredSummary(resumeData, jobTitle, company, matchedSkills),
      highlightedSkills: matchedSkills,
      suggestedAdditions: missingKeywords.slice(0, 5),
      keywordDensity: Math.round((matchedSkills.length / Math.max(jobKeywords.length, 1)) * 100),
      formatSuggestions: this.getFormatSuggestions(jobTitle),
      matchScore: calculateMatchScore(resumeData, { requiredSkills: jobKeywords })
    };

    this.logAction(context.userId, context.jobId, 'tailor_resume', { jobTitle, company }, tailoredSections);
    this.addLearning('tailoring', `For ${jobTitle} at ${company}: focus on ${matchedSkills.join(', ')}`, 0.7, 'tailoring');

    return tailoredSections;
  }

  optimizeForATS(context) {
    const { resumeText } = context;
    if (!resumeText) return { error: 'Resume text required' };

    const suggestions = [];

    if (resumeText.includes('|') || resumeText.includes('┃')) {
      suggestions.push('Remove table formatting - ATS systems may not parse tables correctly');
    }

    if (!/\b(managed|led|developed|created|implemented|achieved|increased|decreased|improved)\b/i.test(resumeText)) {
      suggestions.push('Use strong action verbs to start bullet points (e.g., Managed, Led, Developed)');
    }

    if (!/\d+%|\$\d+|\d+ (team|people|projects|clients)/i.test(resumeText)) {
      suggestions.push('Add quantifiable achievements (e.g., "increased sales by 25%", "managed team of 10")');
    }

    const sections = ['experience', 'education', 'skills', 'summary'];
    const missingSections = sections.filter(s => !resumeText.toLowerCase().includes(s));
    if (missingSections.length > 0) {
      suggestions.push(`Consider adding these standard sections: ${missingSections.join(', ')}`);
    }

    return {
      suggestions,
      atsScore: Math.max(100 - (suggestions.length * 15), 30),
      isATSFriendly: suggestions.length <= 1
    };
  }

  analyzeResume(context) {
    const { resumeData } = context;
    if (!resumeData) return { error: 'Resume data required' };

    return {
      totalSkills: resumeData.skills?.length || 0,
      experienceLevel: this.categorizeExperience(resumeData.experienceYears),
      educationLevel: resumeData.education?.length > 0 ? resumeData.education[0] : 'Not specified',
      hasContact: !!(resumeData.contact?.emails?.length > 0),
      hasLinkedIn: !!resumeData.contact?.linkedin,
      hasGitHub: !!resumeData.contact?.github,
      strengths: resumeData.skills?.slice(0, 5) || [],
      wordCount: resumeData.rawText?.split(/\s+/).length || 0
    };
  }

  suggestImprovements(context) {
    const { resumeData } = context;
    if (!resumeData) return { error: 'Resume data required' };

    const improvements = [];

    if (!resumeData.contact?.linkedin) {
      improvements.push({ area: 'Contact', suggestion: 'Add your LinkedIn profile URL' });
    }
    if (!resumeData.contact?.github) {
      improvements.push({ area: 'Contact', suggestion: 'Add your GitHub profile if applicable' });
    }
    if ((resumeData.skills?.length || 0) < 5) {
      improvements.push({ area: 'Skills', suggestion: 'List at least 8-10 relevant skills' });
    }
    if (!resumeData.experienceYears) {
      improvements.push({ area: 'Experience', suggestion: 'Clearly state your years of experience' });
    }
    if ((resumeData.rawText?.split(/\s+/).length || 0) < 200) {
      improvements.push({ area: 'Content', suggestion: 'Resume is too short. Add more detail to your experience.' });
    }
    if ((resumeData.rawText?.split(/\s+/).length || 0) > 1000) {
      improvements.push({ area: 'Content', suggestion: 'Resume is very long. Consider condensing to 1-2 pages.' });
    }

    return { improvements, overallScore: Math.max(100 - (improvements.length * 12), 20) };
  }

  extractKeywords(text) {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'must', 'need', 'not', 'no', 'we', 'you', 'they', 'he', 'she', 'it', 'this', 'that', 'these', 'those', 'from', 'about', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'over', 'such', 'our', 'your', 'their', 'its']);
    const filtered = words.filter(w => w.length > 2 && !stopWords.has(w));
    const freq = {};
    filtered.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  generateTailoredSummary(resumeData, jobTitle, company, matchedSkills) {
    const expLevel = this.categorizeExperience(resumeData.experienceYears);
    const topSkills = matchedSkills.slice(0, 3).join(', ') || resumeData.skills?.slice(0, 3).join(', ') || 'various technologies';
    return `${expLevel} professional with expertise in ${topSkills}, seeking ${jobTitle} position${company ? ` at ${company}` : ''}. Proven track record of delivering impactful results with strong technical and collaborative skills.`;
  }

  categorizeExperience(years) {
    if (!years || years < 2) return 'Entry-level';
    if (years < 5) return 'Mid-level';
    if (years < 10) return 'Senior';
    return 'Executive-level';
  }

  getFormatSuggestions(jobTitle) {
    const title = (jobTitle || '').toLowerCase();
    if (title.includes('engineer') || title.includes('developer')) {
      return ['Include GitHub/portfolio links', 'List technologies by proficiency', 'Add project descriptions with tech stacks'];
    }
    if (title.includes('manager') || title.includes('director')) {
      return ['Emphasize leadership experience', 'Include team sizes managed', 'Highlight strategic initiatives'];
    }
    if (title.includes('design')) {
      return ['Link to portfolio/Dribbble', 'List design tools', 'Include case study summaries'];
    }
    return ['Use clean formatting', 'Lead with strongest section', 'Include metrics where possible'];
  }
}

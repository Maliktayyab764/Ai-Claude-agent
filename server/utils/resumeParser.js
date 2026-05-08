import fs from 'fs';
import pdfParse from 'pdf-parse';

export async function parseResume(filePath) {
  const ext = filePath.toLowerCase().split('.').pop();

  let rawText = '';

  if (ext === 'pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    rawText = data.text;
  } else if (ext === 'txt') {
    rawText = fs.readFileSync(filePath, 'utf-8');
  } else {
    rawText = fs.readFileSync(filePath, 'utf-8');
  }

  return extractResumeData(rawText);
}

function extractResumeData(text) {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
  const githubRegex = /github\.com\/[\w-]+/gi;

  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  const linkedin = text.match(linkedinRegex) || [];
  const github = text.match(githubRegex) || [];

  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'Swift',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
    'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL', 'REST',
    'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'AI',
    'Agile', 'Scrum', 'Project Management', 'Leadership', 'Communication',
    'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap',
    'Linux', 'DevOps', 'Terraform', 'Ansible',
    'Data Analysis', 'Data Science', 'Statistics', 'R',
    'Figma', 'Adobe', 'UI/UX', 'Design',
    'Sales', 'Marketing', 'SEO', 'Content Writing',
    'Finance', 'Accounting', 'Excel', 'Power BI', 'Tableau'
  ];

  const foundSkills = skillKeywords.filter(skill =>
    text.toLowerCase().includes(skill.toLowerCase())
  );

  const experienceRegex = /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i;
  const expMatch = text.match(experienceRegex);
  const experienceYears = expMatch ? parseInt(expMatch[1]) : null;

  const educationKeywords = ['Bachelor', 'Master', 'PhD', 'B.S.', 'M.S.', 'B.A.', 'M.A.', 'MBA', 'Associate', 'Diploma'];
  const educationFound = educationKeywords.filter(edu =>
    text.toLowerCase().includes(edu.toLowerCase())
  );

  const sections = {
    contact: { emails, phones, linkedin: linkedin[0] || null, github: github[0] || null },
    skills: foundSkills,
    experienceYears,
    education: educationFound,
    rawText: text
  };

  return sections;
}

export function calculateMatchScore(resumeData, jobRequirements) {
  if (!resumeData || !jobRequirements) return 0;

  let score = 0;
  let totalFactors = 0;

  if (resumeData.skills && jobRequirements.requiredSkills) {
    totalFactors++;
    const requiredSkills = jobRequirements.requiredSkills.map(s => s.toLowerCase());
    const userSkills = resumeData.skills.map(s => s.toLowerCase());
    const matchedSkills = requiredSkills.filter(s => userSkills.some(us => us.includes(s) || s.includes(us)));
    score += (matchedSkills.length / Math.max(requiredSkills.length, 1)) * 100;
  }

  if (resumeData.experienceYears !== null && jobRequirements.minExperience !== undefined) {
    totalFactors++;
    if (resumeData.experienceYears >= jobRequirements.minExperience) {
      score += 100;
    } else {
      score += (resumeData.experienceYears / Math.max(jobRequirements.minExperience, 1)) * 80;
    }
  }

  if (jobRequirements.education && resumeData.education) {
    totalFactors++;
    const hasMatch = resumeData.education.some(e =>
      jobRequirements.education.toLowerCase().includes(e.toLowerCase())
    );
    score += hasMatch ? 100 : 30;
  }

  return totalFactors > 0 ? Math.round(score / totalFactors) : 50;
}

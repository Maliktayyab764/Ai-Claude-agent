import BaseAgent from './BaseAgent.js';

export default class FormFillerAgent extends BaseAgent {
  constructor() {
    super('FormFillerAgent', 'Application Form Specialist', [
      'form_analysis',
      'field_mapping',
      'auto_fill',
      'data_validation',
      'question_answering'
    ]);
  }

  async execute(task, context = {}) {
    const { action } = task;

    switch (action) {
      case 'analyze_form':
        return this.analyzeForm(context);
      case 'fill_form':
        return this.fillForm(context);
      case 'answer_questions':
        return this.answerScreeningQuestions(context);
      case 'validate':
        return this.validateFormData(context);
      default:
        return { error: 'Unknown action for FormFillerAgent' };
    }
  }

  analyzeForm(context) {
    const { formFields } = context;
    if (!formFields) return { error: 'Form fields required' };

    const analysis = {
      totalFields: formFields.length,
      requiredFields: formFields.filter(f => f.required).length,
      fieldCategories: this.categorizeFields(formFields),
      estimatedTime: `${Math.ceil(formFields.length * 0.5)} minutes`,
      complexity: formFields.length > 20 ? 'High' : formFields.length > 10 ? 'Medium' : 'Low'
    };

    return analysis;
  }

  fillForm(context) {
    const { formFields, userProfile, resumeData } = context;
    if (!formFields || !userProfile) return { error: 'Form fields and user profile required' };

    const filledFields = formFields.map(field => {
      const value = this.resolveFieldValue(field, userProfile, resumeData);
      return {
        fieldName: field.name,
        fieldType: field.type,
        value,
        confidence: value ? 0.9 : 0.3,
        source: value ? 'user_profile' : 'needs_input',
        autoFilled: !!value
      };
    });

    const autoFilledCount = filledFields.filter(f => f.autoFilled).length;

    this.logAction(context.userId, context.jobId, 'fill_form', { fieldCount: formFields.length }, { autoFilledCount, totalFields: formFields.length });

    return {
      filledFields,
      summary: {
        total: filledFields.length,
        autoFilled: autoFilledCount,
        needsInput: filledFields.length - autoFilledCount,
        completionRate: Math.round((autoFilledCount / Math.max(filledFields.length, 1)) * 100)
      }
    };
  }

  answerScreeningQuestions(context) {
    const { questions, userProfile, resumeData } = context;
    if (!questions) return { error: 'Questions required' };

    const answers = questions.map(q => {
      const answer = this.generateAnswer(q, userProfile, resumeData);
      return {
        question: q.text,
        answer: answer.value,
        confidence: answer.confidence,
        needsReview: answer.confidence < 0.7
      };
    });

    return {
      answers,
      reviewNeeded: answers.filter(a => a.needsReview).length,
      autoAnswered: answers.filter(a => !a.needsReview).length
    };
  }

  validateFormData(context) {
    const { filledFields } = context;
    if (!filledFields) return { error: 'Filled fields required' };

    const validations = filledFields.map(field => {
      const issues = [];

      if (field.required && !field.value) {
        issues.push('Required field is empty');
      }

      if (field.type === 'email' && field.value && !/[\w.-]+@[\w.-]+\.\w+/.test(field.value)) {
        issues.push('Invalid email format');
      }

      if (field.type === 'phone' && field.value && !/^\+?[\d\s()-]{7,}$/.test(field.value)) {
        issues.push('Invalid phone format');
      }

      if (field.type === 'url' && field.value && !/^https?:\/\/.+/.test(field.value)) {
        issues.push('Invalid URL format');
      }

      return {
        fieldName: field.fieldName || field.name,
        valid: issues.length === 0,
        issues
      };
    });

    return {
      validations,
      allValid: validations.every(v => v.valid),
      issueCount: validations.filter(v => !v.valid).length
    };
  }

  categorizeFields(fields) {
    const categories = {
      personal: [],
      contact: [],
      experience: [],
      education: [],
      skills: [],
      questions: [],
      documents: [],
      other: []
    };

    fields.forEach(field => {
      const name = (field.name || '').toLowerCase();
      if (['name', 'first', 'last', 'gender', 'dob', 'birth', 'nationality'].some(k => name.includes(k))) {
        categories.personal.push(field);
      } else if (['email', 'phone', 'address', 'city', 'state', 'zip', 'country'].some(k => name.includes(k))) {
        categories.contact.push(field);
      } else if (['experience', 'work', 'company', 'position', 'title', 'employer'].some(k => name.includes(k))) {
        categories.experience.push(field);
      } else if (['education', 'degree', 'school', 'university', 'gpa', 'major'].some(k => name.includes(k))) {
        categories.education.push(field);
      } else if (['skill', 'technology', 'language', 'certification'].some(k => name.includes(k))) {
        categories.skills.push(field);
      } else if (['resume', 'cv', 'cover', 'portfolio', 'file', 'upload'].some(k => name.includes(k))) {
        categories.documents.push(field);
      } else if (field.type === 'textarea' || name.includes('question') || name.includes('why')) {
        categories.questions.push(field);
      } else {
        categories.other.push(field);
      }
    });

    return categories;
  }

  resolveFieldValue(field, userProfile, resumeData) {
    const name = (field.name || '').toLowerCase();

    const mappings = {
      'first_name': userProfile.name?.split(' ')[0],
      'firstname': userProfile.name?.split(' ')[0],
      'first name': userProfile.name?.split(' ')[0],
      'last_name': userProfile.name?.split(' ').slice(1).join(' '),
      'lastname': userProfile.name?.split(' ').slice(1).join(' '),
      'last name': userProfile.name?.split(' ').slice(1).join(' '),
      'name': userProfile.name,
      'full_name': userProfile.name,
      'fullname': userProfile.name,
      'email': userProfile.email,
      'phone': resumeData?.contact?.phones?.[0],
      'linkedin': resumeData?.contact?.linkedin,
      'github': resumeData?.contact?.github,
      'website': resumeData?.contact?.github ? `https://${resumeData.contact.github}` : null,
      'location': userProfile.preferred_locations ? JSON.parse(userProfile.preferred_locations)[0] : null,
      'city': userProfile.preferred_locations ? JSON.parse(userProfile.preferred_locations)[0] : null
    };

    for (const [key, value] of Object.entries(mappings)) {
      if (name.includes(key) && value) return value;
    }

    if (name.includes('experience') || name.includes('years')) {
      return userProfile.experience_years?.toString();
    }

    if (name.includes('skill')) {
      const skills = userProfile.skills ? JSON.parse(userProfile.skills) : [];
      return skills.join(', ');
    }

    return null;
  }

  generateAnswer(question, userProfile, resumeData) {
    const qText = (question.text || '').toLowerCase();

    if (qText.includes('authorized') || qText.includes('eligible to work')) {
      return { value: 'Yes', confidence: 0.5 };
    }

    if (qText.includes('years of experience') || qText.includes('how many years')) {
      return { value: (userProfile.experience_years || 0).toString(), confidence: 0.9 };
    }

    if (qText.includes('willing to relocate')) {
      return { value: 'Open to discussion', confidence: 0.6 };
    }

    if (qText.includes('salary') || qText.includes('compensation')) {
      return { value: 'Open to discussion based on total compensation package', confidence: 0.5 };
    }

    if (qText.includes('start') || qText.includes('when can you')) {
      return { value: '2 weeks notice', confidence: 0.6 };
    }

    if (qText.includes('remote') || qText.includes('onsite') || qText.includes('hybrid')) {
      return { value: 'Flexible - open to remote, hybrid, or onsite', confidence: 0.6 };
    }

    if (qText.includes('why') && qText.includes('company')) {
      return {
        value: `I am drawn to this opportunity because of the company's innovative approach and alignment with my professional goals and skill set.`,
        confidence: 0.4
      };
    }

    return { value: null, confidence: 0 };
  }
}

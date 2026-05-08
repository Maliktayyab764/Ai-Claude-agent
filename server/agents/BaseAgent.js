import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

export default class BaseAgent {
  constructor(name, role, capabilities = []) {
    this.name = name;
    this.role = role;
    this.capabilities = capabilities;
    this.learnings = [];
    this.loadLearnings();
  }

  loadLearnings() {
    try {
      const rows = db.prepare(
        'SELECT * FROM agent_learnings WHERE agent_name = ? ORDER BY confidence DESC'
      ).all(this.name);
      this.learnings = rows;
    } catch {
      this.learnings = [];
    }
  }

  addLearning(type, content, confidence = 0.5, source = 'self') {
    const id = uuidv4();
    try {
      db.prepare(
        'INSERT INTO agent_learnings (id, agent_name, learning_type, content, confidence, source) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, this.name, type, content, confidence, source);
      this.learnings.push({ id, agent_name: this.name, learning_type: type, content, confidence, source });
    } catch (err) {
      console.error(`[${this.name}] Failed to save learning:`, err.message);
    }
  }

  logAction(userId, jobId, action, input, output, status = 'completed') {
    const id = uuidv4();
    try {
      db.prepare(
        'INSERT INTO agent_logs (id, user_id, job_id, agent_name, action, input_data, output_data, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(id, userId, jobId, this.name, action, JSON.stringify(input), JSON.stringify(output), status);
    } catch (err) {
      console.error(`[${this.name}] Failed to log action:`, err.message);
    }
  }

  addTimelineEvent(jobId, userId, eventType, description, details = null) {
    const id = uuidv4();
    try {
      db.prepare(
        'INSERT INTO application_timeline (id, job_id, user_id, event_type, event_description, agent_name, details) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(id, jobId, userId, eventType, description, this.name, details ? JSON.stringify(details) : null);
    } catch (err) {
      console.error(`[${this.name}] Failed to add timeline event:`, err.message);
    }
  }

  getRelevantLearnings(context) {
    return this.learnings.filter(l => {
      const content = l.content.toLowerCase();
      const ctx = context.toLowerCase();
      return ctx.split(' ').some(word => word.length > 3 && content.includes(word));
    }).slice(0, 5);
  }

  async execute(task, context = {}) {
    throw new Error(`Agent ${this.name} must implement execute()`);
  }

  describe() {
    return {
      name: this.name,
      role: this.role,
      capabilities: this.capabilities,
      learningsCount: this.learnings.length
    };
  }
}

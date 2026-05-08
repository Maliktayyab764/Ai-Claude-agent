import ManagerAgent from './ManagerAgent.js';
import ResumeWriterAgent from './ResumeWriterAgent.js';
import JobReviewerAgent from './JobReviewerAgent.js';
import StrategyMakerAgent from './StrategyMakerAgent.js';
import JobApplierAgent from './JobApplierAgent.js';
import FormFillerAgent from './FormFillerAgent.js';
import CompanyResearcherAgent from './CompanyResearcherAgent.js';
import AccountManagerAgent from './AccountManagerAgent.js';
import OpsManagerAgent from './OpsManagerAgent.js';
import ProductManagerAgent from './ProductManagerAgent.js';

export default class Orchestrator {
  constructor() {
    this.agents = {
      manager: new ManagerAgent(),
      resumeWriter: new ResumeWriterAgent(),
      jobReviewer: new JobReviewerAgent(),
      strategyMaker: new StrategyMakerAgent(),
      jobApplier: new JobApplierAgent(),
      formFiller: new FormFillerAgent(),
      companyResearcher: new CompanyResearcherAgent(),
      accountManager: new AccountManagerAgent(),
      opsManager: new OpsManagerAgent(),
      productManager: new ProductManagerAgent()
    };
  }

  getAgent(name) {
    const agentMap = {
      'manager': this.agents.manager,
      'ManagerAgent': this.agents.manager,
      'resume': this.agents.resumeWriter,
      'ResumeWriterAgent': this.agents.resumeWriter,
      'jobReviewer': this.agents.jobReviewer,
      'JobReviewerAgent': this.agents.jobReviewer,
      'strategy': this.agents.strategyMaker,
      'StrategyMakerAgent': this.agents.strategyMaker,
      'jobApplier': this.agents.jobApplier,
      'JobApplierAgent': this.agents.jobApplier,
      'formFiller': this.agents.formFiller,
      'FormFillerAgent': this.agents.formFiller,
      'companyResearcher': this.agents.companyResearcher,
      'CompanyResearcherAgent': this.agents.companyResearcher,
      'accountManager': this.agents.accountManager,
      'AccountManagerAgent': this.agents.accountManager,
      'opsManager': this.agents.opsManager,
      'OpsManagerAgent': this.agents.opsManager,
      'productManager': this.agents.productManager,
      'ProductManagerAgent': this.agents.productManager
    };

    return agentMap[name] || null;
  }

  async delegateTask(agentName, task, context = {}) {
    const agent = this.getAgent(agentName);
    if (!agent) {
      return { error: `Agent '${agentName}' not found` };
    }

    try {
      const result = await agent.execute(task, context);
      return { agent: agent.name, result };
    } catch (err) {
      return { agent: agentName, error: err.message };
    }
  }

  async runWorkflow(workflowName, context = {}) {
    const workflows = {
      'full_job_search': [
        { agent: 'manager', task: { action: 'plan_job_search' } },
        { agent: 'strategy', task: { action: 'create_strategy' } },
        { agent: 'resume', task: { action: 'analyze' } }
      ],
      'apply_to_job': [
        { agent: 'jobReviewer', task: { action: 'review_job' } },
        { agent: 'companyResearcher', task: { action: 'research' } },
        { agent: 'resume', task: { action: 'tailor' } },
        { agent: 'jobApplier', task: { action: 'apply' } }
      ],
      'setup': [
        { agent: 'resume', task: { action: 'parse' } },
        { agent: 'accountManager', task: { action: 'setup_platforms' } },
        { agent: 'strategy', task: { action: 'create_strategy' } }
      ]
    };

    const workflow = workflows[workflowName];
    if (!workflow) {
      return { error: `Workflow '${workflowName}' not found. Available: ${Object.keys(workflows).join(', ')}` };
    }

    const results = [];
    for (const step of workflow) {
      const result = await this.delegateTask(step.agent, step.task, context);
      results.push(result);
      context = { ...context, ...result.result };
    }

    return { workflow: workflowName, steps: results, completed: true };
  }

  listAgents() {
    return Object.values(this.agents).map(agent => agent.describe());
  }

  getSystemStatus() {
    const agents = this.listAgents();
    return {
      status: 'operational',
      totalAgents: agents.length,
      agents,
      capabilities: agents.reduce((all, agent) => {
        agent.capabilities.forEach(cap => {
          if (!all.includes(cap)) all.push(cap);
        });
        return all;
      }, []),
      totalLearnings: agents.reduce((sum, a) => sum + a.learningsCount, 0)
    };
  }
}

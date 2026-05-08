import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bot, Cpu, Brain, Zap, CheckCircle, Activity } from 'lucide-react';

const agentIcons = {
  ManagerAgent: Cpu,
  ResumeWriterAgent: Brain,
  JobReviewerAgent: CheckCircle,
  StrategyMakerAgent: Zap,
  JobApplierAgent: Activity,
  FormFillerAgent: Bot,
  CompanyResearcherAgent: Brain,
  AccountManagerAgent: Bot,
  OpsManagerAgent: Cpu,
  ProductManagerAgent: Zap,
};

const agentColors = {
  ManagerAgent: 'from-indigo-600 to-purple-600',
  ResumeWriterAgent: 'from-blue-600 to-cyan-600',
  JobReviewerAgent: 'from-emerald-600 to-green-600',
  StrategyMakerAgent: 'from-orange-600 to-yellow-600',
  JobApplierAgent: 'from-pink-600 to-red-600',
  FormFillerAgent: 'from-violet-600 to-purple-600',
  CompanyResearcherAgent: 'from-teal-600 to-cyan-600',
  AccountManagerAgent: 'from-amber-600 to-orange-600',
  OpsManagerAgent: 'from-sky-600 to-blue-600',
  ProductManagerAgent: 'from-rose-600 to-pink-600',
};

export default function AgentsPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAgentStatus()
      .then(data => { setStatus(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  const agents = status?.agents || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Agents</h1>
          <p className="text-gray-500 mt-1">Your team of specialized AI agents working together.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="card py-2 px-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-400">{status?.status || 'Operational'}</span>
          </div>
          <div className="card py-2 px-4">
            <span className="text-sm text-gray-400">{status?.totalAgents || 0} Agents | {status?.totalLearnings || 0} Learnings</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent, i) => {
          const IconComp = agentIcons[agent.name] || Bot;
          const gradient = agentColors[agent.name] || 'from-gray-600 to-gray-700';

          return (
            <div key={i} className="card hover:border-gray-700 transition-all group">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                  <IconComp className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">{agent.name.replace('Agent', '')}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{agent.role}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2" title="Active" />
              </div>

              <div className="mt-4">
                <p className="text-xs text-gray-600 mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities?.slice(0, 4).map((cap, j) => (
                    <span key={j} className="badge badge-gray text-xs">{cap.replace(/_/g, ' ')}</span>
                  ))}
                  {(agent.capabilities?.length || 0) > 4 && (
                    <span className="badge badge-gray text-xs">+{agent.capabilities.length - 4} more</span>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-600">{agent.learningsCount || 0} learnings</span>
                <span className="text-xs text-emerald-500">Active</span>
              </div>
            </div>
          );
        })}
      </div>

      {status?.capabilities && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Total System Capabilities</h3>
          <div className="flex flex-wrap gap-2">
            {status.capabilities.map((cap, i) => (
              <span key={i} className="badge badge-blue text-sm px-3 py-1">{cap.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

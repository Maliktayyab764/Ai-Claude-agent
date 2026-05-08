import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import api from '../utils/api';
import {
  Briefcase, TrendingUp, Clock, CheckCircle, XCircle,
  AlertCircle, ArrowRight, Bot, FileText, Target
} from 'lucide-react';

const statusColors = {
  discovered: 'badge-blue',
  reviewing: 'badge-yellow',
  applying: 'badge-yellow',
  applied: 'badge-purple',
  interview_scheduled: 'badge-green',
  interviewed: 'badge-green',
  offer_received: 'badge-green',
  accepted: 'badge-green',
  rejected: 'badge-red',
  withdrawn: 'badge-gray',
};

export default function DashboardPage() {
  const { user } = useUser();
  const [dashboard, setDashboard] = useState(null);
  const [agents, setAgents] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.getDashboard(user.id).catch(() => ({ result: { overview: { statusBreakdown: [], totalApplications: 0 }, recentActivity: [], recentJobs: [], needsAction: [] } })),
      api.getAgentStatus().catch(() => ({ totalAgents: 10, status: 'operational' }))
    ]).then(([dash, ag]) => {
      setDashboard(dash.result || dash);
      setAgents(ag);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const overview = dashboard?.overview || {};
  const statusBreakdown = overview.statusBreakdown || [];
  const totalApps = overview.totalApplications || 0;

  const getStatusCount = (status) => {
    const item = statusBreakdown.find(s => s.status === status);
    return item?.count || 0;
  };

  const stats = [
    { label: 'Total Jobs', value: statusBreakdown.reduce((sum, s) => sum + s.count, 0), icon: Briefcase, color: 'text-blue-400' },
    { label: 'Applied', value: totalApps, icon: FileText, color: 'text-purple-400' },
    { label: 'Interviews', value: getStatusCount('interview_scheduled') + getStatusCount('interviewed'), icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Offers', value: getStatusCount('offer_received') + getStatusCount('accepted'), icon: CheckCircle, color: 'text-green-400' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name || 'User'}</h1>
          <p className="text-gray-500 mt-1">Your AI agents are ready to help you land your dream job.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-800 rounded-lg px-3 py-2">
          <Bot className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400">{agents?.totalAgents || 10} Agents Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" /> Recent Activity
          </h2>
          {(dashboard?.recentActivity || []).length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No activity yet. Start by uploading your resume and adding jobs.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(dashboard.recentActivity || []).slice(0, 8).map((event, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-800">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300">{event.event_description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">{event.agent_name}</span>
                      <span className="text-xs text-gray-700">|</span>
                      <span className="text-xs text-gray-600">{new Date(event.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" /> Needs Attention
          </h2>
          {(dashboard?.needsAction || []).length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">All caught up! No items need attention.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(dashboard.needsAction || []).map((job, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-800">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.company}</p>
                  </div>
                  <span className={`badge ${statusColors[job.status] || 'badge-gray'}`}>
                    {job.status?.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-400" /> Application Pipeline
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Discovered', status: 'discovered', color: 'border-blue-800 bg-blue-900/20' },
            { label: 'Reviewing', status: 'reviewing', color: 'border-yellow-800 bg-yellow-900/20' },
            { label: 'Applied', status: 'applied', color: 'border-purple-800 bg-purple-900/20' },
            { label: 'Interview', status: 'interview_scheduled', color: 'border-emerald-800 bg-emerald-900/20' },
            { label: 'Offers', status: 'offer_received', color: 'border-green-800 bg-green-900/20' },
            { label: 'Rejected', status: 'rejected', color: 'border-red-800 bg-red-900/20' },
          ].map((stage, i) => (
            <div key={i} className={`rounded-lg border p-4 text-center ${stage.color}`}>
              <p className="text-2xl font-bold text-white">{getStatusCount(stage.status)}</p>
              <p className="text-xs text-gray-400 mt-1">{stage.label}</p>
            </div>
          ))}
        </div>
      </div>

      {!user?.resume_path && (
        <div className="card border-indigo-800 bg-indigo-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="w-10 h-10 text-indigo-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Upload Your Resume</h3>
                <p className="text-sm text-gray-400">Get started by uploading your resume so our AI agents can analyze your skills.</p>
              </div>
            </div>
            <a href="/resume" className="btn-primary flex items-center gap-2">
              Upload <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

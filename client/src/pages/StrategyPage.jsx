import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import api from '../utils/api';
import {
  Target, TrendingUp, Map, Calendar, ChevronRight,
  Lightbulb, BarChart3, Compass, Rocket
} from 'lucide-react';

export default function StrategyPage() {
  const { user } = useUser();
  const [strategy, setStrategy] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStrategy = async () => {
    setLoading(true);
    try {
      const skills = user.skills ? JSON.parse(user.skills) : [];
      const [strat, rm, mkt] = await Promise.all([
        api.createStrategy({ userProfile: user, preferences: { locations: user.preferred_locations ? JSON.parse(user.preferred_locations) : ['Remote'], jobTypes: user.preferred_job_types ? JSON.parse(user.preferred_job_types) : ['Full-time'] }, userId: user.id }),
        api.getRoadmap(user.id),
        api.analyzeMarket({ skills, location: user.preferred_locations ? JSON.parse(user.preferred_locations)[0] : 'Remote' })
      ]);
      setStrategy(strat.result || strat);
      setRoadmap(rm.result || rm);
      setMarket(mkt.result || mkt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Search Strategy</h1>
          <p className="text-gray-500 mt-1">AI-powered strategy and roadmap for your job search.</p>
        </div>
        <button onClick={loadStrategy} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Rocket className="w-4 h-4" />}
          {loading ? 'Generating...' : strategy ? 'Refresh Strategy' : 'Generate Strategy'}
        </button>
      </div>

      {!strategy && !loading && (
        <div className="card text-center py-16">
          <Target className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No strategy generated yet</h3>
          <p className="text-gray-600 mb-4">Upload your resume first, then generate a personalized job search strategy.</p>
          <button onClick={loadStrategy} className="btn-primary">Generate Strategy</button>
        </div>
      )}

      {strategy && (
        <>
          {strategy.overview && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" /> Strategy Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Target Roles</p>
                  <div className="space-y-1">
                    {(strategy.overview.targetRoles || []).map((role, i) => (
                      <p key={i} className="text-sm text-gray-300">{role}</p>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Target Industries</p>
                  <div className="flex flex-wrap gap-1">
                    {(strategy.overview.targetIndustries || []).map((ind, i) => (
                      <span key={i} className="badge badge-blue">{ind}</span>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Company Sizes</p>
                  <div className="space-y-1">
                    {(strategy.overview.targetCompanySizes || []).map((size, i) => (
                      <p key={i} className="text-sm text-gray-300">{size}</p>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Preferences</p>
                  <p className="text-sm text-gray-300">Locations: {(strategy.overview.geographicFocus || []).join(', ')}</p>
                  <p className="text-sm text-gray-300 mt-1">Types: {(strategy.overview.workTypePreference || []).join(', ')}</p>
                </div>
              </div>
            </div>
          )}

          {strategy.applicationPlan && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" /> Application Plan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-800 text-center">
                  <p className="text-3xl font-bold text-white">{strategy.applicationPlan.dailyTarget}</p>
                  <p className="text-sm text-gray-400">Daily Target</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800 text-center">
                  <p className="text-3xl font-bold text-white">{strategy.applicationPlan.weeklyGoal}</p>
                  <p className="text-sm text-gray-400">Weekly Goal</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-800 text-center">
                  <p className="text-3xl font-bold text-white">{(strategy.applicationPlan.platformStrategy || []).length}</p>
                  <p className="text-sm text-gray-400">Platforms</p>
                </div>
              </div>
              {strategy.applicationPlan.platformStrategy && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 mb-2">Recommended Platforms</p>
                  {strategy.applicationPlan.platformStrategy.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-800">
                      <div className="flex items-center gap-3">
                        <span className={`badge ${p.priority === 'Essential' ? 'badge-green' : p.priority === 'High' ? 'badge-blue' : 'badge-gray'}`}>{p.priority}</span>
                        <span className="text-sm font-medium text-gray-200">{p.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{p.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {strategy.skillGapAnalysis && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" /> Skill Gap Analysis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gray-800">
                  <p className="text-xs text-gray-500 mb-2">Current Strengths</p>
                  <div className="flex flex-wrap gap-1">{(strategy.skillGapAnalysis.currentStrengths || []).map((s, i) => <span key={i} className="badge badge-green">{s}</span>)}</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-800">
                  <p className="text-xs text-gray-500 mb-2">Suggested to Learn</p>
                  <div className="flex flex-wrap gap-1">{(strategy.skillGapAnalysis.suggestedToLearn || []).map((s, i) => <span key={i} className="badge badge-yellow">{s}</span>)}</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-800">
                  <p className="text-xs text-gray-500 mb-2">Urgency</p>
                  <p className="text-sm text-gray-300">{strategy.skillGapAnalysis.urgency}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {roadmap && roadmap.phases && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" /> Roadmap
          </h2>
          <div className="space-y-4">
            {roadmap.phases.map((phase, i) => (
              <div key={i} className={`p-4 rounded-lg border ${phase.status === 'active' ? 'border-indigo-600 bg-indigo-950/20' : phase.status === 'completed' ? 'border-emerald-800 bg-emerald-950/10' : 'border-gray-800 bg-gray-800/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400">Week {phase.week}</span>
                    <h3 className="text-base font-semibold text-white">{phase.name}</h3>
                  </div>
                  <span className={`badge ${phase.status === 'active' ? 'badge-blue' : phase.status === 'completed' ? 'badge-green' : 'badge-gray'}`}>{phase.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {phase.milestones?.map((m, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-gray-400">
                      <ChevronRight className="w-3 h-3 text-gray-600" />
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {market && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Market Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gray-800">
              <p className="text-sm font-medium text-gray-300 mb-2">Demand Level: <span className={`${market.demandLevel === 'High' ? 'text-emerald-400' : market.demandLevel === 'Moderate' ? 'text-yellow-400' : 'text-red-400'}`}>{market.demandLevel}</span></p>
              <p className="text-xs text-gray-500 mb-2">Hot Skills Matched</p>
              <div className="flex flex-wrap gap-1">{(market.hotSkillsMatched || []).map((s, i) => <span key={i} className="badge badge-green">{s}</span>)}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-800">
              <p className="text-sm font-medium text-gray-300 mb-2">Salary Trends</p>
              {market.salaryTrends && Object.entries(market.salaryTrends).filter(([k]) => k !== 'note').map(([level, range]) => (
                <div key={level} className="flex items-center justify-between text-sm py-1">
                  <span className="text-gray-400 capitalize">{level}</span>
                  <span className="text-emerald-400">{range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

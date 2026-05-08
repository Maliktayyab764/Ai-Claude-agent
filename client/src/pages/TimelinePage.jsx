import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import api from '../utils/api';
import { Clock, Bot, Building2, ChevronRight, Filter } from 'lucide-react';

const eventTypeColors = {
  application_submitted: 'bg-indigo-500',
  status_change: 'bg-yellow-500',
  follow_up_scheduled: 'bg-blue-500',
  review_completed: 'bg-emerald-500',
  resume_tailored: 'bg-purple-500',
  company_researched: 'bg-teal-500',
};

export default function TimelinePage() {
  const { user } = useUser();
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all');

  useEffect(() => {
    if (!user) return;
    api.getTimeline(user.id)
      .then(data => {
        setTimeline(data.result || data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  const events = timeline?.timeline || [];
  const grouped = timeline?.groupedByJob || {};

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Application Timeline</h1>
          <p className="text-gray-500 mt-1">Track every step of your job application journey.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('all')} className={viewMode === 'all' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>All Events</button>
          <button onClick={() => setViewMode('grouped')} className={viewMode === 'grouped' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>By Job</button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-16">
          <Clock className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No timeline events yet</h3>
          <p className="text-gray-600">Events will appear here as you add and apply to jobs.</p>
        </div>
      ) : viewMode === 'all' ? (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-800" />
          <div className="space-y-4">
            {events.map((event, i) => (
              <div key={i} className="relative flex gap-4 pl-14">
                <div className={`absolute left-[18px] w-3 h-3 rounded-full ${eventTypeColors[event.event_type] || 'bg-gray-500'} ring-4 ring-gray-950`} />
                <div className="card flex-1 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-200">{event.event_description}</p>
                      {event.job_title && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {event.job_title} at {event.company}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs text-gray-600">{new Date(event.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-700">{new Date(event.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  {event.agent_name && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Bot className="w-3 h-3 text-indigo-400" />
                      <span className="text-xs text-indigo-400">{event.agent_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([jobId, jobGroup]) => (
            <div key={jobId} className="card">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-semibold text-white">{jobGroup.jobTitle}</h3>
                  <p className="text-sm text-gray-500">{jobGroup.company}</p>
                </div>
                <span className="badge badge-blue ml-auto">{jobGroup.events?.length || 0} events</span>
              </div>
              <div className="space-y-3">
                {(jobGroup.events || []).map((event, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-gray-800/30">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${eventTypeColors[event.event_type] || 'bg-gray-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-300">{event.event_description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-600">{new Date(event.created_at).toLocaleDateString()}</span>
                        {event.agent_name && <span className="text-xs text-indigo-400">{event.agent_name}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

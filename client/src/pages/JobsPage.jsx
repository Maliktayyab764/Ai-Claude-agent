import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import api from '../utils/api';
import {
  Plus, Search, Filter, MapPin, Building2, Clock, Star,
  Send, Trash2, Eye, ChevronDown, Briefcase, Globe, X
} from 'lucide-react';

const statusColors = {
  discovered: 'badge-blue', reviewing: 'badge-yellow', applying: 'badge-yellow',
  applied: 'badge-purple', interview_scheduled: 'badge-green', interviewed: 'badge-green',
  offer_received: 'badge-green', accepted: 'badge-green', rejected: 'badge-red', withdrawn: 'badge-gray',
};

export default function JobsPage() {
  const { user } = useUser();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddJob, setShowAddJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [newJob, setNewJob] = useState({ title: '', company: '', location: '', job_type: 'Full-time', remote_type: 'onsite', description: '', requirements: '', salary_range: '', source_url: '', source_platform: '' });
  const [reviewResult, setReviewResult] = useState(null);

  const loadJobs = () => {
    if (!user) return;
    const params = statusFilter ? `status=${statusFilter}` : '';
    api.getJobs(user.id, params).then(data => { setJobs(data.jobs || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { loadJobs(); }, [user, statusFilter]);

  const handleAddJob = async (e) => {
    e.preventDefault();
    try {
      await api.createJob({ ...newJob, user_id: user.id });
      setShowAddJob(false);
      setNewJob({ title: '', company: '', location: '', job_type: 'Full-time', remote_type: 'onsite', description: '', requirements: '', salary_range: '', source_url: '', source_platform: '' });
      loadJobs();
    } catch (err) { alert(err.message); }
  };

  const handleReviewJob = async (job) => {
    try {
      const userProfile = { skills: user.skills, experience_years: user.experience_years, preferred_locations: user.preferred_locations, preferred_job_types: user.preferred_job_types };
      const result = await api.reviewJob({ job, userProfile, userId: user.id });
      setReviewResult(result.result || result);
      setSelectedJob(job);
    } catch (err) { alert(err.message); }
  };

  const handleApply = async (job) => {
    try {
      await api.applyToJob({ job, userId: user.id });
      loadJobs();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Delete this job?')) return;
    try { await api.deleteJob(jobId); loadJobs(); } catch (err) { alert(err.message); }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await api.updateJobStatus({ jobId, userId: user.id, newStatus });
      loadJobs();
    } catch (err) { alert(err.message); }
  };

  const filtered = jobs.filter(j =>
    (!filter || j.title?.toLowerCase().includes(filter.toLowerCase()) || j.company?.toLowerCase().includes(filter.toLowerCase()))
  );

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Jobs</h1>
        <button onClick={() => setShowAddJob(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Job</button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search jobs..." className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-48">
          <option value="">All Statuses</option>
          <option value="discovered">Discovered</option>
          <option value="reviewing">Reviewing</option>
          <option value="applied">Applied</option>
          <option value="interview_scheduled">Interview</option>
          <option value="offer_received">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No jobs found</h3>
          <p className="text-gray-600 mb-4">Add jobs to start tracking your applications.</p>
          <button onClick={() => setShowAddJob(true)} className="btn-primary">Add Your First Job</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <div key={job.id} className="card hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white truncate">{job.title}</h3>
                    <span className={`badge ${statusColors[job.status] || 'badge-gray'}`}>{job.status?.replace(/_/g, ' ')}</span>
                    {job.match_score > 0 && <span className="badge badge-blue flex items-center gap-1"><Star className="w-3 h-3" />{job.match_score}% match</span>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{job.company}</span>
                    {job.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>}
                    {job.remote_type && <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{job.remote_type}</span>}
                    {job.job_type && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{job.job_type}</span>}
                    {job.salary_range && <span className="text-emerald-400">{job.salary_range}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => handleReviewJob(job)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"><Eye className="w-3 h-3" /> Review</button>
                  {job.status === 'discovered' && <button onClick={() => handleApply(job)} className="btn-success text-xs px-3 py-1.5 flex items-center gap-1"><Send className="w-3 h-3" /> Apply</button>}
                  <select value={job.status} onChange={(e) => handleStatusChange(job.id, e.target.value)} className="input-field text-xs py-1.5 w-32">
                    <option value="discovered">Discovered</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="applied">Applied</option>
                    <option value="interview_scheduled">Interview</option>
                    <option value="offer_received">Offer</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                  <button onClick={() => handleDelete(job.id)} className="text-gray-600 hover:text-red-400 p-1.5"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddJob && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Add New Job</h2>
              <button onClick={() => setShowAddJob(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-1">Job Title *</label><input value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} className="input-field" required /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Company *</label><input value={newJob.company} onChange={(e) => setNewJob({...newJob, company: e.target.value})} className="input-field" required /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Location</label><input value={newJob.location} onChange={(e) => setNewJob({...newJob, location: e.target.value})} className="input-field" placeholder="e.g., New York, NY" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Salary Range</label><input value={newJob.salary_range} onChange={(e) => setNewJob({...newJob, salary_range: e.target.value})} className="input-field" placeholder="e.g., $80k - $120k" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Job Type</label>
                  <select value={newJob.job_type} onChange={(e) => setNewJob({...newJob, job_type: e.target.value})} className="input-field">
                    <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option><option>Freelance</option>
                  </select></div>
                <div><label className="block text-sm text-gray-400 mb-1">Remote Type</label>
                  <select value={newJob.remote_type} onChange={(e) => setNewJob({...newJob, remote_type: e.target.value})} className="input-field">
                    <option value="onsite">Onsite</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option>
                  </select></div>
                <div><label className="block text-sm text-gray-400 mb-1">Source URL</label><input value={newJob.source_url} onChange={(e) => setNewJob({...newJob, source_url: e.target.value})} className="input-field" placeholder="Link to job posting" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Platform</label><input value={newJob.source_platform} onChange={(e) => setNewJob({...newJob, source_platform: e.target.value})} className="input-field" placeholder="e.g., LinkedIn, Indeed" /></div>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Job Description</label><textarea value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} className="input-field h-24" placeholder="Paste the full job description..." /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Requirements</label><textarea value={newJob.requirements} onChange={(e) => setNewJob({...newJob, requirements: e.target.value})} className="input-field h-20" placeholder="List the job requirements..." /></div>
              <div className="flex gap-3 pt-2"><button type="submit" className="btn-primary flex-1">Add Job</button><button type="button" onClick={() => setShowAddJob(false)} className="btn-secondary flex-1">Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {reviewResult && selectedJob && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Job Review: {selectedJob.title}</h2>
              <button onClick={() => { setReviewResult(null); setSelectedJob(null); }} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="text-center p-6 rounded-lg bg-gray-800">
                <p className="text-4xl font-bold text-white mb-1">{reviewResult.overallScore || 0}%</p>
                <p className="text-gray-400">Overall Match Score</p>
                <p className={`text-sm mt-2 font-medium ${(reviewResult.overallScore || 0) >= 60 ? 'text-emerald-400' : 'text-yellow-400'}`}>{reviewResult.recommendation}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['locationMatch', 'typeMatch', 'skillMatch', 'experienceMatch'].map(key => (
                  <div key={key} className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                    <p className="text-sm text-gray-400 capitalize">{key.replace('Match', ' Match')}</p>
                    <p className="text-xl font-bold text-white">{reviewResult[key]?.score || 0}%</p>
                    <p className="text-xs text-gray-500 mt-1">{reviewResult[key]?.details}</p>
                  </div>
                ))}
              </div>
              {reviewResult.redFlags?.length > 0 && (
                <div className="p-4 rounded-lg bg-red-900/20 border border-red-800">
                  <p className="text-sm font-medium text-red-400 mb-2">Red Flags</p>
                  <ul className="text-sm text-gray-400 space-y-1">{reviewResult.redFlags.map((f, i) => <li key={i}>- {f}</li>)}</ul>
                </div>
              )}
              {reviewResult.greenFlags?.length > 0 && (
                <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-800">
                  <p className="text-sm font-medium text-emerald-400 mb-2">Green Flags</p>
                  <ul className="text-sm text-gray-400 space-y-1">{reviewResult.greenFlags.map((f, i) => <li key={i}>- {f}</li>)}</ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

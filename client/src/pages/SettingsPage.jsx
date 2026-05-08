import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import api from '../utils/api';
import {
  Settings, User, Mail, MapPin, Briefcase, Save,
  Link, CheckCircle, XCircle, Globe
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updateProfile } = useUser();
  const [formData, setFormData] = useState({
    name: '', preferred_locations: '', preferred_job_types: [],
    preferred_roles: '', experience_years: 0, skills: ''
  });
  const [gmailStatus, setGmailStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFormData({
      name: user.name || '',
      preferred_locations: user.preferred_locations ? JSON.parse(user.preferred_locations).join(', ') : '',
      preferred_job_types: user.preferred_job_types ? JSON.parse(user.preferred_job_types) : [],
      preferred_roles: user.preferred_roles ? JSON.parse(user.preferred_roles).join(', ') : '',
      experience_years: user.experience_years || 0,
      skills: user.skills ? JSON.parse(user.skills).join(', ') : ''
    });
    api.getGmailStatus(user.id).then(setGmailStatus).catch(() => {});
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name: formData.name,
        preferred_locations: formData.preferred_locations.split(',').map(s => s.trim()).filter(Boolean),
        preferred_job_types: formData.preferred_job_types,
        preferred_roles: formData.preferred_roles.split(',').map(s => s.trim()).filter(Boolean),
        experience_years: parseInt(formData.experience_years) || 0,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const data = await api.connectGmail(user.id);
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
      } else if (data.setupInstructions) {
        alert('Gmail not configured yet. See console for setup instructions.');
        console.log('Gmail Setup Instructions:', data.setupInstructions);
      }
    } catch (err) { alert(err.message); }
  };

  const handleDisconnectGmail = async () => {
    try {
      await api.disconnectGmail(user.id);
      setGmailStatus({ ...gmailStatus, connected: false });
    } catch (err) { alert(err.message); }
  };

  const toggleJobType = (type) => {
    setFormData(prev => ({
      ...prev,
      preferred_job_types: prev.preferred_job_types.includes(type)
        ? prev.preferred_job_types.filter(t => t !== type)
        : [...prev.preferred_job_types, type]
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" /> Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Full Name</label>
              <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input value={user?.email || ''} disabled className="input-field opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Years of Experience</label>
              <input type="number" min="0" max="50" value={formData.experience_years} onChange={(e) => setFormData({...formData, experience_years: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Skills (comma separated)</label>
              <input value={formData.skills} onChange={(e) => setFormData({...formData, skills: e.target.value})} className="input-field" placeholder="React, Python, AWS..." />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" /> Job Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Preferred Locations (comma separated)</label>
              <input value={formData.preferred_locations} onChange={(e) => setFormData({...formData, preferred_locations: e.target.value})} className="input-field" placeholder="New York, San Francisco, Remote..." />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Job Types</label>
              <div className="flex flex-wrap gap-2">
                {['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'].map(type => (
                  <button key={type} type="button" onClick={() => toggleJobType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      formData.preferred_job_types.includes(type)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                    }`}>{type}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Target Roles (comma separated)</label>
              <input value={formData.preferred_roles} onChange={(e) => setFormData({...formData, preferred_roles: e.target.value})} className="input-field" placeholder="Full-Stack Developer, ML Engineer..." />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </form>

      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-400" /> Gmail Integration
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gmailStatus?.connected ? 'bg-emerald-900/30' : 'bg-gray-800'}`}>
              <Mail className={`w-5 h-5 ${gmailStatus?.connected ? 'text-emerald-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">
                {gmailStatus?.connected ? 'Gmail Connected' : 'Gmail Not Connected'}
              </p>
              <p className="text-xs text-gray-500">
                {gmailStatus?.connected ? gmailStatus.email : 'Connect your Gmail for automated applications'}
              </p>
            </div>
          </div>
          {gmailStatus?.connected ? (
            <button onClick={handleDisconnectGmail} className="btn-danger text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Disconnect
            </button>
          ) : (
            <button onClick={handleConnectGmail} className="btn-primary text-sm flex items-center gap-2">
              <Link className="w-4 h-4" /> Connect Gmail
            </button>
          )}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-gray-800/50 border border-gray-800">
          <p className="text-xs text-gray-500">
            Gmail integration uses Google's free OAuth2 API. You need to set up a Google Cloud project (free) to enable this feature.
            The software uses your Gmail only for creating job platform accounts and receiving application notifications.
          </p>
        </div>
      </div>
    </div>
  );
}

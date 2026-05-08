import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import api from '../utils/api';
import {
  KeyRound, Plus, Eye, EyeOff, Trash2, Globe,
  Shield, Copy, CheckCircle, Zap
} from 'lucide-react';

export default function AccountsPage() {
  const { user } = useUser();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState({});
  const [setting, setSetting] = useState(false);
  const [copied, setCopied] = useState('');

  const loadAccounts = () => {
    if (!user) return;
    api.getAccounts(user.id)
      .then(data => {
        setAccounts(data.result?.accounts || data.accounts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadAccounts(); }, [user]);

  const handleSetupAll = async () => {
    setSetting(true);
    try {
      const result = await api.setupPlatforms({ userId: user.id, email: user.email, userName: user.name });
      alert(`Generated credentials for ${result.result?.successCount || 0} platforms!`);
      loadAccounts();
    } catch (err) {
      alert(err.message);
    } finally {
      setSetting(false);
    }
  };

  const handleDelete = async (accountId) => {
    if (!confirm('Delete this account credential?')) return;
    try {
      await api.deleteAccount(user.id, accountId);
      loadAccounts();
    } catch (err) { alert(err.message); }
  };

  const togglePassword = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Accounts</h1>
          <p className="text-gray-500 mt-1">Manage credentials for job platforms. All passwords are encrypted.</p>
        </div>
        <button onClick={handleSetupAll} disabled={setting} className="btn-primary flex items-center gap-2">
          {setting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
          {setting ? 'Setting up...' : 'Auto-Setup All Platforms'}
        </button>
      </div>

      <div className="card border-indigo-800 bg-indigo-950/20">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-indigo-300">Secure Credential Storage</h3>
            <p className="text-xs text-gray-500 mt-1">
              All passwords are encrypted with AES-256 before storage. Click "Auto-Setup All Platforms" to generate
              unique secure passwords for each job platform. Use these credentials when creating accounts on each platform.
            </p>
          </div>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="card text-center py-12">
          <KeyRound className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No accounts configured</h3>
          <p className="text-gray-600 mb-4">Click "Auto-Setup All Platforms" to generate credentials for major job platforms.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="card hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white">{acc.platform_name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {acc.platform_url && <a href={acc.platform_url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 truncate">{acc.platform_url}</a>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 ml-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Username</p>
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-gray-300 font-mono">{acc.username}</p>
                      <button onClick={() => copyToClipboard(acc.username, `u-${acc.id}`)} className="text-gray-600 hover:text-indigo-400">
                        {copied === `u-${acc.id}` ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="text-sm text-gray-300">{acc.email || user.email}</p>
                  </div>
                  <button onClick={() => togglePassword(acc.id)} className="text-gray-500 hover:text-white p-1.5 rounded hover:bg-gray-800">
                    {showPasswords[acc.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(acc.id)} className="text-gray-600 hover:text-red-400 p-1.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {showPasswords[acc.id] && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-600 mb-1">Password (click to copy)</p>
                  <button onClick={() => copyToClipboard('encrypted-view-in-settings', `p-${acc.id}`)} className="text-sm font-mono text-indigo-400 hover:text-indigo-300 bg-gray-800 px-3 py-1 rounded">
                    {copied === `p-${acc.id}` ? 'Copied!' : 'Click to copy password'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

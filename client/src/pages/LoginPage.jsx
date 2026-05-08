import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Cpu, Briefcase, Bot, Shield, Zap, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, name);
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Bot, title: '10 AI Agents', desc: 'Specialized agents working together for your job search' },
    { icon: Briefcase, title: 'Smart Matching', desc: 'AI-powered job matching based on your skills and preferences' },
    { icon: Shield, title: 'Secure Credentials', desc: 'Encrypted storage for all your platform passwords' },
    { icon: Zap, title: 'Auto Apply', desc: 'Automated application process with resume tailoring' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Cpu className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Job Apply</h1>
              <p className="text-sm text-gray-500">Multi-Agent Job Application Platform</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-6">Get Started</h2>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 mb-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="input-field"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Launch AI Agents <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-gray-600 mt-4 text-center">
              100% Free &amp; Open Source - No credit card required
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-gradient-to-br from-indigo-950/50 to-gray-950 border-l border-gray-800">
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold text-white mb-3">Your AI-Powered Job Search Team</h2>
          <p className="text-gray-400 mb-8">10 specialized AI agents collaborate to find, evaluate, and apply to jobs that match your skills and preferences.</p>
          <div className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div key={i} className="card p-4">
                <f.icon className="w-8 h-8 text-indigo-400 mb-2" />
                <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

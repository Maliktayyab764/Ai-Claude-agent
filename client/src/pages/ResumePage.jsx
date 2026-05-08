import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import api from '../utils/api';
import {
  Upload, FileText, CheckCircle, AlertTriangle, Trash2,
  Zap, Star, ArrowRight, RefreshCw
} from 'lucide-react';

export default function ResumePage() {
  const { user, refreshUser } = useUser();
  const [resumeInfo, setResumeInfo] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.getResume(user.id).then(data => { setResumeInfo(data); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const result = await api.uploadResume(user.id, formData);
      setUploadResult(result);
      setResumeInfo({ hasResume: true, skills: result.resumeData?.skills || [], experienceYears: result.resumeData?.experienceYears });
      await refreshUser();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
  };

  const handleDelete = async () => {
    if (!confirm('Delete your resume?')) return;
    try {
      await api.deleteResume(user.id);
      setResumeInfo(null);
      setUploadResult(null);
      await refreshUser();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Resume Manager</h1>

      {!resumeInfo?.hasResume && !uploadResult ? (
        <div
          className={`card border-2 border-dashed ${dragActive ? 'border-indigo-500 bg-indigo-950/30' : 'border-gray-700'} cursor-pointer transition-all`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('resume-upload').click()}
        >
          <div className="text-center py-12">
            {uploading ? (
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            ) : (
              <Upload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              {uploading ? 'Analyzing your resume...' : 'Upload Your Resume'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Drag & drop or click to select. Supports PDF, TXT, DOC, DOCX (max 10MB)
            </p>
            {!uploading && <p className="text-xs text-indigo-400">Our AI agents will analyze your skills, experience, and optimize for ATS</p>}
          </div>
          <input id="resume-upload" type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleFileSelect} className="hidden" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Resume Uploaded</h3>
                <p className="text-sm text-gray-500">
                  {resumeInfo?.skills?.length || 0} skills detected | {resumeInfo?.experienceYears || 0} years experience
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="btn-secondary text-sm flex items-center gap-2 cursor-pointer">
                <RefreshCw className="w-4 h-4" /> Re-upload
                <input type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleFileSelect} className="hidden" />
              </label>
              <button onClick={handleDelete} className="btn-danger text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>

          {resumeInfo?.skills?.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" /> Detected Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {resumeInfo.skills.map((skill, i) => (
                  <span key={i} className="badge badge-blue text-sm px-3 py-1">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {uploadResult?.analysis?.result && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400" /> Resume Analysis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(uploadResult.analysis.result).filter(([k]) => k !== 'strengths').map(([key, val]) => (
                  <div key={key} className="p-3 rounded-lg bg-gray-800">
                    <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-lg font-semibold text-white mt-1">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadResult?.atsOptimization?.result && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> ATS Optimization
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center p-4 rounded-lg bg-gray-800">
                  <p className="text-3xl font-bold text-white">{uploadResult.atsOptimization.result.atsScore || 0}%</p>
                  <p className="text-xs text-gray-500">ATS Score</p>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${uploadResult.atsOptimization.result.atsScore || 0}%` }} />
                  </div>
                  <p className={`text-sm mt-2 ${uploadResult.atsOptimization.result.isATSFriendly ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {uploadResult.atsOptimization.result.isATSFriendly ? 'ATS Friendly' : 'Needs Improvement'}
                  </p>
                </div>
              </div>
              {uploadResult.atsOptimization.result.suggestions?.length > 0 && (
                <div className="space-y-2">
                  {uploadResult.atsOptimization.result.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-gray-800/50">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-400">{s}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {uploadResult?.improvements?.result?.improvements?.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-indigo-400" /> Improvement Suggestions
              </h3>
              <div className="space-y-3">
                {uploadResult.improvements.result.improvements.map((imp, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-800">
                    <span className="badge badge-yellow text-xs">{imp.area}</span>
                    <p className="text-sm text-gray-300">{imp.suggestion}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-gray-800 text-center">
                <p className="text-sm text-gray-400">Overall Resume Score</p>
                <p className="text-2xl font-bold text-white">{uploadResult.improvements.result.overallScore}%</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

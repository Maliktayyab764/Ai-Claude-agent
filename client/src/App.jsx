import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import ResumePage from './pages/ResumePage';
import AgentsPage from './pages/AgentsPage';
import TimelinePage from './pages/TimelinePage';
import AccountsPage from './pages/AccountsPage';
import SettingsPage from './pages/SettingsPage';
import StrategyPage from './pages/StrategyPage';
import LoginPage from './pages/LoginPage';

function AppLayout() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading AI Job Apply Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/strategy" element={<StrategyPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppLayout />
    </UserProvider>
  );
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUserId = localStorage.getItem('jobapply_user_id');
    if (savedUserId) {
      api.getUser(savedUserId)
        .then(data => { setUser(data.user); setLoading(false); })
        .catch(() => { localStorage.removeItem('jobapply_user_id'); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, name, preferences = {}) => {
    const data = await api.createUser({ email, name, ...preferences });
    const u = data.user;
    setUser(u);
    localStorage.setItem('jobapply_user_id', u.id);
    return u;
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const data = await api.updateUser(user.id, updates);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('jobapply_user_id');
  };

  const refreshUser = async () => {
    if (!user) return;
    const data = await api.getUser(user.id);
    setUser(data.user);
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout, updateProfile, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}

export default UserContext;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { mcp } from '../services/mcpService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile();
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async () => {
    try {
      const userData = await mcp.call('getProfile');
      if (userData) {
        setUser(userData);
        setProfile(userData.profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const checkAdminStatus = async (email) => {
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    return adminCheck !== null;
  };

  const signIn = async (email, password) => {
    return await mcp.call('signIn', { email, password });
  };

  const signUp = async (email, password, name, role = 'user') => {
    return await mcp.call('signUp', { email, password, name, role });
  };

  const signOut = async () => {
    return await mcp.call('signOut');
  };

  return (
    <AuthContext.Provider value={{ user, profile, signIn, signUp, signOut, loading, loadProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

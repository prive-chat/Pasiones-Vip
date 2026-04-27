import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, authUserEmail?: string) => {
    // Solo poner loading si no tenemos perfil o es cambio de usuario
    if (!profile || profile.id !== userId) {
      setLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn('Error fetching profile from DB:', error.message);
        // Fallback: Si no hay perfil en la DB, construir uno básico con el objeto de Auth
        setProfile({
          id: userId,
          email: authUserEmail || '',
          full_name: 'Usuario en sincronización',
          username: authUserEmail?.split('@')[0] || 'usuario',
          avatar_url: null,
          cover_url: null,
          is_verified: false,
          is_private: false,
          role: authUserEmail === 'privechat.vip@gmail.com' ? 'super_admin' : 'user',
          created_at: new Date().toISOString()
        } as UserProfile);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Force local sign out even if the network call fails
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      setUser(null);
      setProfile(null);
      // Clear persistence if any
      localStorage.removeItem('supabase.auth.token');
      // Redirect or force reload
      window.location.href = '/';
    }
  };

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
      console.error('Supabase credentials missing or invalid');
      setLoading(false);
      return;
    }

    // Safety timeout: never stay in loading state for more than 5 seconds
    const timeoutId = setTimeout(() => {
      setLoading(current => {
        if (current) {
          console.warn('Auth initialization timed out. Forcing loading to false.');
          return false;
        }
        return current;
      });
    }, 5000);

    // Initialize auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if (session?.user) {
        const isNewUser = !user || user.id !== session.user.id;
        setUser(session.user);
        
        // Evitar fetch profile si el evento no es relevante y ya tenemos perfil
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || isNewUser) {
          fetchProfile(session.user.id, session.user.email);
        } else {
           setLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [user?.id, profile?.id]);

  useEffect(() => {
    // Loading is handled within getSession and onAuthStateChange
  }, [user, profile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

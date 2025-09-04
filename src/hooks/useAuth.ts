import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  username?: string;
  mobile_number?: string;
  role: 'super_admin' | 'lab_admin' | 'branch_operator' | 'admin' | 'operator_1' | 'operator_2' | 'operator_3';
  lab_id?: string;
  branch_id?: string;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId: string) => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setError(profileError.message);
          // Continue without profile if it fails
          return null;
        }
        
        return profileData;
      } catch (err) {
        console.error('Unexpected error fetching profile:', err);
        return null;
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setError(null);
        
        if (session?.user) {
          // Use setTimeout to prevent Supabase deadlock
          setTimeout(() => {
            fetchProfile(session.user.id).then(profileData => {
              if (mounted) {
                setProfile(profileData);
                setLoading(false);
              }
            });
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(profileData => {
          if (mounted) {
            setProfile(profileData);
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    // Use the database function to get email by username
    const { data: email, error: rpcError } = await supabase
      .rpc('get_email_by_username', { input_username: username });
    
    if (rpcError || !email) {
      return { error: { message: 'Invalid username or password' } };
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: string, labId?: string, branchId?: string, mobileNumber?: string, skipEmailConfirmation: boolean = false) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role,
          lab_id: labId,
          branch_id: branchId,
          mobile_number: mobileNumber,
          skip_email_confirmation: skipEmailConfirmation
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    session,
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };
}
import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  hashToken, 
  getClientIP, 
  getUserAgent, 
  parseRateLimitResponse,
  getSessionExpiryDate,
  type RateLimitState 
} from '@/lib/security';

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

export interface AuthError {
  message: string;
  rateLimitState?: RateLimitState;
}

// Type for the rate limit RPC response
interface RateLimitRpcResponse {
  allowed: boolean;
  remaining_attempts: number;
  locked_until: string | null;
  message: string | null;
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

  const signIn = async (username: string, password: string): Promise<{ error: AuthError | null; rateLimitState?: RateLimitState }> => {
    try {
      // Get client info for rate limiting and logging
      const [ipAddress, userAgent] = await Promise.all([
        getClientIP(),
        Promise.resolve(getUserAgent())
      ]);

      // 1. Check rate limit before attempting login
      const { data: rateLimitRaw, error: rateLimitError } = await supabase.rpc('check_login_rate_limit', {
        p_username: username,
        p_ip_address: ipAddress
      });

      // Cast the response to our expected type (using unknown first for type safety)
      const rateLimitData = rateLimitRaw as unknown as RateLimitRpcResponse | null;

      if (rateLimitError) {
        console.error('Rate limit check failed:', rateLimitError);
        // Continue with login attempt even if rate limit check fails
      }

      if (rateLimitData && !rateLimitData.allowed) {
        const rateLimitState = parseRateLimitResponse(rateLimitData);
        return { 
          error: { 
            message: rateLimitState.message || 'Too many failed attempts. Please try again later.',
            rateLimitState 
          },
          rateLimitState
        };
      }

      // 2. Get email by username
      const { data: email, error: rpcError } = await supabase
        .rpc('get_email_by_username', { input_username: username });
      
      if (rpcError || !email) {
        // Log failed attempt (user not found)
        await supabase.rpc('log_login_attempt', {
          p_username: username,
          p_ip_address: ipAddress,
          p_user_agent: userAgent,
          p_success: false,
          p_failure_reason: 'Invalid username',
          p_user_id: null
        });
        
        return { 
          error: { message: 'Invalid username or password' },
          rateLimitState: rateLimitData ? parseRateLimitResponse(rateLimitData) : undefined
        };
      }
      
      // 3. Attempt Supabase Auth sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 4. Log the login attempt
      await supabase.rpc('log_login_attempt', {
        p_username: username,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_success: !error,
        p_failure_reason: error?.message || null,
        p_user_id: data?.user?.id || null
      });

      if (error) {
        return { 
          error: { message: 'Invalid username or password' },
          rateLimitState: rateLimitData ? parseRateLimitResponse(rateLimitData) : undefined
        };
      }

      // 5. Create session record on successful login
      if (data?.session) {
        try {
          const tokenHash = await hashToken(data.session.access_token);
          const expiresAt = getSessionExpiryDate();
          
          await supabase.rpc('create_user_session', {
            p_user_id: data.user.id,
            p_token_hash: tokenHash,
            p_ip_address: ipAddress,
            p_user_agent: userAgent,
            p_expires_at: expiresAt.toISOString()
          });
        } catch (sessionError) {
          console.error('Failed to create session record:', sessionError);
          // Don't fail login if session recording fails
        }
      }

      return { error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: { message: 'An unexpected error occurred. Please try again.' } };
    }
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

  const signOut = async (logoutAll: boolean = false) => {
    // Invalidate session(s) in database before signing out
    if (user) {
      try {
        await supabase.rpc('logout_user', {
          p_user_id: user.id,
          p_logout_all: logoutAll
        });
      } catch (err) {
        console.error('Failed to invalidate session:', err);
        // Continue with sign out even if session invalidation fails
      }
    }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Refresh session periodically
  const refreshSession = useCallback(async () => {
    if (!session?.access_token) return;
    
    try {
      const tokenHash = await hashToken(session.access_token);
      await supabase.rpc('refresh_user_session', {
        p_token_hash: tokenHash
      });
    } catch (err) {
      console.error('Failed to refresh session:', err);
    }
  }, [session?.access_token]);

  return {
    session,
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };
}
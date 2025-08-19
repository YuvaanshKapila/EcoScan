import { supabase } from '@/lib/supabase';
import { AuthState, User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  const checkSession = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || new Date().toISOString(),
        };
        setState({ user, session, isLoading: false, error: null });
        await AsyncStorage.setItem('user', JSON.stringify(user));
      } else {
        setState({ user: null, session: null, isLoading: false, error: null });
        await AsyncStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  };

  useEffect(() => {
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              created_at: session.user.created_at || new Date().toISOString(),
            };
            setState({ user, session, isLoading: false, error: null });
            await AsyncStorage.setItem('user', JSON.stringify(user));
          }
        } else if (event === 'SIGNED_OUT') {
          setState({ user: null, session: null, isLoading: false, error: null });
          await AsyncStorage.removeItem('user');
          router.replace('/auth/login');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Please check your email to verify your account.' 
          }));
          return false;
        }
        throw error;
      }
      
      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at || new Date().toISOString(),
        };
        setState({ user, session: data.session, isLoading: false, error: null });
        await AsyncStorage.setItem('user', JSON.stringify(user));
        router.replace('/');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error signing in:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Invalid credentials' 
      }));
      return false;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) throw error;
      
      setState(prev => ({ ...prev, isLoading: false }));
      

      return { needsConfirmation: true };
    } catch (error) {
      console.error('Error signing up:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
      return false;
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await AsyncStorage.removeItem('user');
      
      setState({ user: null, session: null, isLoading: false, error: null });
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  };

  return {
    user: state.user,
    session: state.session,
    isLoading: state.isLoading,
    error: state.error,
    signIn,
    signUp,
    signOut,
    checkSession,
  };
});

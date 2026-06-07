import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Create Context
const AuthContext = createContext(null);

// Initial State
const initialState = {
  user: null,
  session: null,
  loading: true,
};

// Reducer Function
function authReducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return {
        ...state,
        user: action.payload?.user || null,
        session: action.payload || null,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        user: null,
        session: null,
        loading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    if (!supabase) {
      dispatch({ type: 'SET_SESSION', payload: null });
      return;
    }

    // Retrieve active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({ type: 'SET_SESSION', payload: session });
    }).catch(err => {
      console.error("Error retrieving Supabase session:", err.message);
      dispatch({ type: 'SET_SESSION', payload: null });
    });

    // Listen to session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({ type: 'SET_SESSION', payload: session });
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // SignUp function
  const signUp = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    if (!supabase) {
      // Mock signup fallback
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = { id: 'mock-uuid-123', email };
          const mockSession = { user: mockUser, access_token: 'mock-token' };
          dispatch({ type: 'SET_SESSION', payload: mockSession });
          resolve({ data: { user: mockUser, session: mockSession }, error: null });
        }, 800);
      });
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { data: null, error };
    }
  };

  // SignIn function
  const signIn = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    if (!supabase) {
      // Mock signin fallback
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockUser = { id: 'mock-uuid-123', email };
          const mockSession = { user: mockUser, access_token: 'mock-token' };
          dispatch({ type: 'SET_SESSION', payload: mockSession });
          resolve({ data: { user: mockUser, session: mockSession }, error: null });
        }, 800);
      });
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { data: null, error };
    }
  };

  // SignOut function
  const signOut = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    if (!supabase) {
      dispatch({ type: 'SIGN_OUT' });
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      dispatch({ type: 'SIGN_OUT' });
      return { error: null };
    } catch (error) {
      console.error("Signout Error:", error.message);
      dispatch({ type: 'SET_LOADING', payload: false });
      return { error };
    }
  };

  const value = {
    user: state.user,
    session: state.session,
    loading: state.loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

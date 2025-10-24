import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthSubscription = { unsubscribe: () => void } | null;

let authSubscription: AuthSubscription = null;

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasInitialized: boolean;
  signUp: (email: string, password: string, userData?: { name?: string }) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      hasInitialized: false,

      signUp: async (email: string, password: string, userData = {}) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: userData,
            },
          });

          if (error) {
            console.error('注册错误:', error);
            return { error: error.message };
          }

          if (data.user) {
            set({ user: data.user, isAuthenticated: true });
          }

          return {};
        } catch (error) {
          console.error('注册异常:', error);
          return { error: '注册失败，请稍后重试' };
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('登录错误:', error);
            return { error: error.message };
          }

          if (data.user) {
            set({ user: data.user, isAuthenticated: true });
          }

          return {};
        } catch (error) {
          console.error('登录异常:', error);
          return { error: '登录失败，请稍后重试' };
        }
      },

      signOut: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('退出登录错误:', error);
          }
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('退出登录异常:', error);
        }
      },

      initialize: async () => {
        if (get().hasInitialized) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            throw error;
          }

          const sessionUser = data.session?.user ?? null;

          set({
            user: sessionUser,
            isAuthenticated: Boolean(sessionUser),
          });

          if (!authSubscription) {
            const { data: subscriptionData } = supabase.auth.onAuthStateChange((_event, session) => {
              const nextUser = session?.user ?? null;
              set({
                user: nextUser,
                isAuthenticated: Boolean(nextUser),
              });
            });

            authSubscription = subscriptionData.subscription;
          }
        } catch (error) {
          console.error('初始化认证状态失败:', error);
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false, hasInitialized: true });
        }
      },
    }),
    {
      name: 'orbital-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
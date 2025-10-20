import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, userData?: { name?: string }) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

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
        try {
          set({ isLoading: true });
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            set({ 
              user: session.user, 
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
            set({ 
              user: null, 
              isAuthenticated: false,
              isLoading: false 
            });
          }

          // 监听认证状态变化
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              set({ user: session.user, isAuthenticated: true });
            } else {
              set({ user: null, isAuthenticated: false });
            }
          });
        } catch (error) {
          console.error('初始化认证状态失败:', error);
          set({ isLoading: false });
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
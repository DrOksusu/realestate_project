import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User, token: string, rememberMe?: boolean) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: (user, token, rememberMe = true) => {
    if (typeof window !== 'undefined') {
      // rememberMe가 true면 localStorage, false면 sessionStorage 사용
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', token);
      storage.setItem('user', JSON.stringify(user));
      // rememberMe 상태도 저장 (로그아웃 시 사용)
      localStorage.setItem('rememberMe', String(rememberMe));
    }
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    console.log('[Auth] loadFromStorage 시작', new Date().toISOString());
    if (typeof window !== 'undefined') {
      // localStorage 먼저 확인, 없으면 sessionStorage 확인
      let token = localStorage.getItem('token');
      let userStr = localStorage.getItem('user');
      console.log('[Auth] localStorage 체크:', { hasToken: !!token, hasUser: !!userStr });

      if (!token || !userStr) {
        token = sessionStorage.getItem('token');
        userStr = sessionStorage.getItem('user');
        console.log('[Auth] sessionStorage 체크:', { hasToken: !!token, hasUser: !!userStr });
      }

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('[Auth] 인증 정보 복원 성공:', user.email);
          set({ user, token, isAuthenticated: true, isHydrated: true });
        } catch {
          console.log('[Auth] 인증 정보 파싱 실패');
          set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
        }
      } else {
        console.log('[Auth] 저장된 인증 정보 없음');
        set({ isHydrated: true });
      }
    } else {
      console.log('[Auth] window 객체 없음 (SSR)');
      set({ isHydrated: true });
    }
    console.log('[Auth] loadFromStorage 완료', new Date().toISOString());
  },
}));

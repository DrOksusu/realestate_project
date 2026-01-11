'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { loadFromStorage, isAuthenticated, isHydrated } = useAuthStore();

  console.log('[Home] 렌더링:', { isHydrated, isAuthenticated }, new Date().toISOString());

  useEffect(() => {
    console.log('[Home] useEffect - loadFromStorage 호출');
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('[Home] useEffect - 인증 체크:', { isHydrated, isAuthenticated });
    // 스토리지 로딩이 완료된 후에만 리다이렉트
    if (isHydrated) {
      if (isAuthenticated) {
        console.log('[Home] → /dashboard로 이동');
        router.push('/dashboard');
      } else {
        console.log('[Home] → /login으로 이동');
        router.push('/login');
      }
    }
  }, [isHydrated, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

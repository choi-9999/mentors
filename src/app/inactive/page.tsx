'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function InactivePage() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">계정이 비활성화되었습니다</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          본사 관리자에 의해 계정이 일시 중지 또는 비활성화되었습니다. 문의 사항은 247 본사 담당자에게 연락해 주세요.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </div>
    </main>
  );
}

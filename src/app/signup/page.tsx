import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Branch } from '@/lib/types';
import { MentorSignupForm } from '@/components/MentorSignupForm';
import { PageLoading } from '@/components/PageLoading';
import { AntigravityCanvas } from '@/components/AntigravityCanvas';

async function SignupContent({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const supabase = await createClient();

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .eq('status', 'active')
    .order('name', { ascending: true });

  return (
    <MentorSignupForm
      branches={(branches as Branch[]) ?? []}
      initialInviteCode={code ?? ''}
    />
  );
}

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-10">
      <AntigravityCanvas />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            메인으로
          </Link>
        </div>

        <Suspense fallback={<PageLoading label="지점 목록을 불러오는 중..." />}>
          <SignupContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

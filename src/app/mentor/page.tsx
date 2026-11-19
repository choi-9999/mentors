import { Suspense } from 'react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { MentorDashboard, type MentorRequestWithBranch } from '@/components/MentorDashboard';
import { PageLoading } from '@/components/PageLoading';
import type { Branch, MentorProfile } from '@/lib/types';

async function MentorContent() {
  const session = await requireRole(['mentor']);
  const supabase = await createClient();

  const [
    { data: mentorProfile },
    { data: mentorBranches },
    { data: branches },
    { data: requests },
  ] = await Promise.all([
    supabase.from('mentor_profiles').select('*').eq('id', session.userId).single(),
    supabase.from('mentor_branches').select('branch_id').eq('mentor_id', session.userId),
    supabase.from('branches').select('*').eq('status', 'active').order('name', { ascending: true }),
    supabase
      .from('matching_requests')
      .select('*, branch:branches(id, region, name)')
      .eq('mentor_id', session.userId)
      .order('created_at', { ascending: false }),
  ]);

  if (!mentorProfile) {
    return (
      <main className="mx-auto max-w-3xl p-8 text-center text-sm text-slate-600">
        멘토 스펙 정보가 없습니다. 본사 관리자에게 문의해주세요.
      </main>
    );
  }

  return (
    <MentorDashboard
      key={session.userId}
      profile={session.profile}
      mentorProfile={mentorProfile as MentorProfile}
      selectedBranchIds={(mentorBranches ?? []).map((b) => b.branch_id)}
      branches={(branches as Branch[]) ?? []}
      requests={(requests as MentorRequestWithBranch[]) ?? []}
    />
  );
}

export default function MentorPage() {
  return (
    <Suspense fallback={<PageLoading label="멘토 대시보드를 불러오는 중..." />}>
      <MentorContent />
    </Suspense>
  );
}

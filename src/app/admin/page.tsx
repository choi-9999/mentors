import { Suspense } from 'react';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminDashboard, type AdminMentorRow } from '@/components/AdminDashboard';
import { PageLoading } from '@/components/PageLoading';
import type { Branch, InviteCode, MatchingRequest, MentorProfile, Profile } from '@/lib/types';

async function AdminContent() {
  const session = await requireRole(['admin']);
  const admin = createAdminClient();

  const [
    { data: branchesData },
    { data: profilesData },
    { data: mentorProfilesData },
    { data: requestsData },
    { data: inviteCodesData },
  ] = await Promise.all([
    admin.from('branches').select('*').order('region').order('name'),
    admin.from('profiles').select('*').order('created_at', { ascending: false }),
    admin.from('mentor_profiles').select('*'),
    admin.from('matching_requests').select('*').order('created_at', { ascending: false }),
    admin.from('invite_codes').select('*').order('created_at', { ascending: false }),
  ]);

  const allProfiles = (profilesData as Profile[]) ?? [];
  const mentorProfileMap = new Map(
    ((mentorProfilesData as MentorProfile[]) ?? []).map((mp) => [mp.id, mp])
  );

  const mentors: AdminMentorRow[] = allProfiles
    .filter((p) => p.role === 'mentor')
    .map((p) => ({
      ...p,
      mentor_profile: mentorProfileMap.get(p.id) ?? null,
    }));

  const branchAccounts = allProfiles.filter((p) => p.role === 'branch');

  return (
    <AdminDashboard
      key={session.userId}
      adminName={session.profile.name}
      branches={(branchesData as Branch[]) ?? []}
      mentors={mentors}
      branchAccounts={branchAccounts}
      requests={(requestsData as MatchingRequest[]) ?? []}
      inviteCodes={(inviteCodesData as InviteCode[]) ?? []}
    />
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<PageLoading label="본사 관리자 대시보드를 불러오는 중..." />}>
      <AdminContent />
    </Suspense>
  );
}

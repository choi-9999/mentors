import { Suspense } from 'react';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { BranchDashboard, type BranchSentRequest } from '@/components/BranchDashboard';
import { PageLoading } from '@/components/PageLoading';
import type { Branch, MentorDirectoryItem } from '@/lib/types';

async function BranchContent() {
  const session = await requireRole(['branch']);
  const supabase = await createClient();

  const [
    { data: branchesData },
    { data: directoryData },
    { data: mentorBranchesData },
    { data: sentRequestsData },
  ] = await Promise.all([
    supabase.from('branches').select('*').eq('status', 'active').order('name', { ascending: true }),
    supabase.from('mentor_directory').select('*').eq('is_active', true).order('updated_at', { ascending: false }),
    supabase.from('mentor_branches').select('mentor_id, branch_id'),
    supabase
      .from('matching_requests')
      .select('*')
      .eq('branch_user_id', session.userId)
      .order('created_at', { ascending: false }),
  ]);

  const branches = (branchesData as Branch[]) ?? [];
  const branchMap = new Map(branches.map((b) => [b.id, b]));

  const mentorBranchIdsMap = new Map<string, string[]>();
  for (const row of mentorBranchesData ?? []) {
    const arr = mentorBranchIdsMap.get(row.mentor_id) ?? [];
    arr.push(row.branch_id);
    mentorBranchIdsMap.set(row.mentor_id, arr);
  }

  const mentors: MentorDirectoryItem[] = (directoryData ?? []).map((m) => {
    const ids = mentorBranchIdsMap.get(m.id) ?? [];
    const matchedBranches = ids
      .map((id) => branchMap.get(id))
      .filter((b): b is Branch => Boolean(b))
      .map((b) => ({ id: b.id, region: b.region, name: b.name }));

    return {
      ...m,
      branch_ids: ids,
      branches: matchedBranches,
    };
  });

  const acceptedMentorIds = (sentRequestsData ?? [])
    .filter((r) => r.status === 'accepted')
    .map((r) => r.mentor_id);

  const acceptedContactMap = new Map<string, { phone: string | null; email: string | null }>();
  if (acceptedMentorIds.length > 0) {
    const { data: acceptedProfiles } = await supabase
      .from('profiles')
      .select('id, phone, email')
      .in('id', acceptedMentorIds);

    for (const p of acceptedProfiles ?? []) {
      acceptedContactMap.set(p.id, { phone: p.phone, email: p.email });
    }
  }

  const mentorDirectoryMap = new Map(mentors.map((m) => [m.id, m]));
  const sentRequests: BranchSentRequest[] = (sentRequestsData ?? []).map((req) => {
    const dir = mentorDirectoryMap.get(req.mentor_id);
    const contact = acceptedContactMap.get(req.mentor_id);
    return {
      ...req,
      mentor: dir
        ? {
            id: dir.id,
            name: dir.name,
            university: dir.university,
            major: dir.major,
            phone: contact?.phone ?? null,
            email: contact?.email ?? null,
          }
        : null,
    };
  });

  return (
    <BranchDashboard
      key={session.userId}
      userName={session.profile.name}
      myBranch={session.branch}
      mentors={mentors}
      sentRequests={sentRequests}
    />
  );
}

export default function BranchPage() {
  return (
    <Suspense fallback={<PageLoading label="지점 대시보드를 불러오는 중..." />}>
      <BranchContent />
    </Suspense>
  );
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Branch, Profile, UserRole } from '@/lib/types';

export interface CurrentSession {
  userId: string;
  profile: Profile;
  branch: Branch | null;
}

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  let branch: Branch | null = null;
  if (profile.branch_id) {
    const { data: branchData } = await supabase
      .from('branches')
      .select('*')
      .eq('id', profile.branch_id)
      .single();
    branch = (branchData as Branch) ?? null;
  }

  return {
    userId: user.id,
    profile: profile as Profile,
    branch,
  };
}

export async function requireRole(allowedRoles: UserRole[]): Promise<CurrentSession> {
  const session = await getCurrentSession();
  if (!session) {
    redirect('/login');
  }
  if (!session.profile.is_active) {
    redirect('/inactive');
  }
  if (session.profile.role === 'branch' && session.branch?.status === 'closed') {
    redirect('/inactive');
  }
  if (!allowedRoles.includes(session.profile.role)) {
    const fallback =
      session.profile.role === 'admin'
        ? '/admin'
        : session.profile.role === 'branch'
          ? '/branch'
          : '/mentor';
    redirect(fallback);
  }
  return session;
}

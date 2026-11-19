import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: '본사 관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const { id } = await params;
  const { is_active } = (await request.json()) as { is_active: boolean };

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ is_active: Boolean(is_active) })
    .eq('id', id)
    .eq('role', 'mentor');

  if (error) {
    return NextResponse.json({ error: '멘토 상태 변경에 실패했습니다.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

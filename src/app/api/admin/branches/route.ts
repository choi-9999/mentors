import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: '본사 관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const { region, name } = (await request.json()) as { region: string; name: string };
  if (!region || !name?.trim()) {
    return NextResponse.json({ error: '권역과 지점명을 입력해주세요.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('branches').insert({
    region,
    name: name.trim(),
    status: 'active',
  });

  if (error) {
    return NextResponse.json({ error: '지점 추가에 실패했습니다. (중복 이름 확인)' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: '본사 관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const { id, status } = (await request.json()) as { id: string; status: 'active' | 'closed' };
  const admin = createAdminClient();
  const { error } = await admin.from('branches').update({ status }).eq('id', id);

  if (error) {
    return NextResponse.json({ error: '지점 상태 변경에 실패했습니다.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

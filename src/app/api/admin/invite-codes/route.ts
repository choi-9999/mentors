import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: '본사 관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const { code, description, max_uses } = (await request.json()) as {
    code: string;
    description?: string;
    max_uses?: number | null;
  };

  if (!code?.trim()) {
    return NextResponse.json({ error: '초대 코드를 입력해주세요.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('invite_codes').insert({
    code: code.trim(),
    description: description?.trim() || null,
    max_uses: max_uses && max_uses > 0 ? max_uses : null,
    is_active: true,
  });

  if (error) {
    return NextResponse.json({ error: '초대 코드 생성에 실패했습니다. (중복 확인)' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: '본사 관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const { id, is_active } = (await request.json()) as { id: string; is_active: boolean };
  const admin = createAdminClient();
  const { error } = await admin
    .from('invite_codes')
    .update({ is_active: Boolean(is_active) })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: '초대 코드 상태 변경에 실패했습니다.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

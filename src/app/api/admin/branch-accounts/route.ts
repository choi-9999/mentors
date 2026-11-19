import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: '본사 관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const { branch_id, email, password, name } = (await request.json()) as {
    branch_id: string;
    email: string;
    password: string;
    name: string;
  };

  if (!branch_id || !email?.trim() || !password || password.length < 6 || !name?.trim()) {
    return NextResponse.json(
      { error: '지점, 이메일, 담당자명, 6자 이상 비밀번호를 모두 입력해주세요.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });

  if (authError || !created.user) {
    return NextResponse.json(
      { error: authError?.message || '지점 계정 생성에 실패했습니다.' },
      { status: 400 }
    );
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: created.user.id,
    role: 'branch',
    email: email.trim(),
    name: name.trim(),
    branch_id,
    is_active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: '지점 프로필 저장에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: '본사 관리자 권한이 필요합니다.' }, { status: 403 });
  }

  const { user_id, new_password } = (await request.json()) as {
    user_id: string;
    new_password: string;
  };

  if (!user_id || !new_password || new_password.length < 6) {
    return NextResponse.json({ error: '6자 이상의 새 비밀번호를 입력해주세요.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user_id, {
    password: new_password,
  });

  if (error) {
    return NextResponse.json({ error: '비밀번호 초기화에 실패했습니다.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface MentorSignupBody {
  inviteCode: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  gender: '남성' | '여성';
  university: string;
  major: string;
  enrollment_status: '재학' | '휴학' | '졸업';
  subjects: string[];
  available_days: string[];
  hourly_wage_tier: string;
  wage_note?: string;
  bio?: string;
  branch_ids: string[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MentorSignupBody;

    const code = body.inviteCode?.trim();
    if (!code) {
      return NextResponse.json({ error: '초대 코드를 입력해주세요.' }, { status: 400 });
    }
    if (!body.email || !body.password || body.password.length < 6) {
      return NextResponse.json(
        { error: '이메일과 6자 이상의 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }
    if (!body.name || !body.phone || !body.university || !body.major) {
      return NextResponse.json(
        { error: '이름, 연락처, 대학, 학과를 모두 입력해주세요.' },
        { status: 400 }
      );
    }
    if (!body.subjects?.length || !body.available_days?.length) {
      return NextResponse.json(
        { error: '멘토링 가능 과목과 가능 요일을 최소 1개 이상 선택해주세요.' },
        { status: 400 }
      );
    }
    if (!body.branch_ids?.length) {
      return NextResponse.json(
        { error: '활동 가능 지점을 최소 1개 이상 선택해주세요.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. 초대 코드 검증
    const { data: invite, error: inviteError } = await admin
      .from('invite_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: '유효하지 않거나 비활성화된 초대 코드입니다.' },
        { status: 400 }
      );
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: '만료된 초대 코드입니다.' }, { status: 400 });
    }

    if (invite.max_uses !== null && invite.used_count >= invite.max_uses) {
      return NextResponse.json(
        { error: '사용 횟수가 초과된 초대 코드입니다.' },
        { status: 400 }
      );
    }

    // 2. Auth 사용자 생성
    const { data: createdUser, error: authError } = await admin.auth.admin.createUser({
      email: body.email.trim(),
      password: body.password,
      email_confirm: true,
    });

    if (authError || !createdUser.user) {
      const msg =
        authError?.message?.includes('already been registered')
          ? '이미 가입된 이메일입니다.'
          : authError?.message || '회원가입 중 오류가 발생했습니다.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const userId = createdUser.user.id;

    // 3. profiles, mentor_profiles, mentor_branches 저장
    const { error: profileError } = await admin.from('profiles').insert({
      id: userId,
      role: 'mentor',
      email: body.email.trim(),
      name: body.name.trim(),
      phone: body.phone.trim(),
      is_active: true,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: '프로필 생성에 실패했습니다.' }, { status: 500 });
    }

    const { error: mentorError } = await admin.from('mentor_profiles').insert({
      id: userId,
      gender: body.gender,
      university: body.university.trim(),
      major: body.major.trim(),
      enrollment_status: body.enrollment_status,
      subjects: body.subjects,
      available_days: body.available_days,
      hourly_wage_tier: body.hourly_wage_tier,
      wage_note: body.wage_note?.trim() || null,
      bio: body.bio?.trim() || null,
      is_remote_available: false,
      is_recruiting: true,
    });

    if (mentorError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: '멘토 스펙 저장에 실패했습니다.' }, { status: 500 });
    }

    if (body.branch_ids?.length) {
      const branchRows = body.branch_ids.map((branchId) => ({
        mentor_id: userId,
        branch_id: branchId,
      }));
      await admin.from('mentor_branches').insert(branchRows);
    }

    // 4. 초대 코드 사용 횟수 증가
    await admin
      .from('invite_codes')
      .update({ used_count: invite.used_count + 1 })
      .eq('id', invite.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[mentor-signup]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

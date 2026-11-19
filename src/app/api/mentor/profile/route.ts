import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: body.name?.trim(),
        phone: body.phone?.trim(),
      })
      .eq('id', user.id);

    if (profileError) {
      return NextResponse.json({ error: '기본 정보 수정에 실패했습니다.' }, { status: 400 });
    }

    const { error: mentorError } = await supabase
      .from('mentor_profiles')
      .update({
        gender: body.gender,
        university: body.university?.trim(),
        major: body.major?.trim(),
        enrollment_status: body.enrollment_status,
        subjects: body.subjects ?? [],
        available_days: body.available_days ?? [],
        hourly_wage_tier: body.hourly_wage_tier,
        wage_note: body.wage_note?.trim() || null,
        bio: body.bio?.trim() || null,
        is_remote_available: false,
        is_recruiting: Boolean(body.is_recruiting),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (mentorError) {
      return NextResponse.json({ error: '멘토 스펙 수정에 실패했습니다.' }, { status: 400 });
    }

    // 가능 지점 동기화
    await supabase.from('mentor_branches').delete().eq('mentor_id', user.id);

    if (Array.isArray(body.branch_ids) && body.branch_ids.length > 0) {
      const rows = body.branch_ids.map((branchId: string) => ({
        mentor_id: user.id,
        branch_id: branchId,
      }));
      await supabase.from('mentor_branches').insert(rows);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[mentor/profile PUT]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

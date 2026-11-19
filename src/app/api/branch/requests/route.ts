import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { sendMatchingRequestEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { data: branchProfile } = await supabase
      .from('profiles')
      .select('role, branch_id, is_active')
      .eq('id', user.id)
      .single();

    if (!branchProfile || branchProfile.role !== 'branch' || !branchProfile.branch_id) {
      return NextResponse.json({ error: '지점 계정 권한이 필요합니다.' }, { status: 403 });
    }

    if (!branchProfile.is_active) {
      return NextResponse.json({ error: '비활성화된 계정입니다.' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.mentor_id || !body.message?.trim() || !body.branch_contact_name?.trim() || !body.branch_contact_phone?.trim()) {
      return NextResponse.json(
        { error: '담당자 성함, 연락처, 요청 메시지를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase.from('matching_requests').insert({
      branch_user_id: user.id,
      branch_id: branchProfile.branch_id,
      mentor_id: body.mentor_id,
      subjects: body.subjects ?? [],
      preferred_days: body.preferred_days ?? [],
      proposed_wage: body.proposed_wage?.trim() || null,
      message: body.message.trim(),
      branch_contact_name: body.branch_contact_name.trim(),
      branch_contact_phone: body.branch_contact_phone.trim(),
      status: 'pending',
    });

    if (insertError) {
      return NextResponse.json({ error: '요청 저장에 실패했습니다.' }, { status: 400 });
    }

    // 멘토 이메일 및 지점명 조회 후 자동 이메일 발송 (실패해도 요청 자체는 성공 처리)
    const admin = createAdminClient();
    const [{ data: mentorInfo }, { data: branchInfo }] = await Promise.all([
      admin.from('profiles').select('name, email').eq('id', body.mentor_id).single(),
      admin.from('branches').select('name').eq('id', branchProfile.branch_id).single(),
    ]);

    let emailSent = false;
    if (mentorInfo?.email) {
      const emailResult = await sendMatchingRequestEmail({
        to: mentorInfo.email,
        mentorName: mentorInfo.name,
        branchName: branchInfo?.name ?? '247 지점',
        subjects: body.subjects ?? [],
        preferredDays: body.preferred_days ?? [],
        proposedWage: body.proposed_wage?.trim() || null,
        message: body.message.trim(),
      });
      emailSent = emailResult.sent;
    }

    return NextResponse.json({ ok: true, emailSent });
  } catch (err) {
    console.error('[branch/requests POST]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as {
      status: 'accepted' | 'rejected';
      reject_reason?: string;
    };

    if (body.status !== 'accepted' && body.status !== 'rejected') {
      return NextResponse.json({ error: '잘못된 상태 값입니다.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('matching_requests')
      .update({
        status: body.status,
        reject_reason: body.status === 'rejected' ? body.reject_reason?.trim() || null : null,
        responded_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('mentor_id', user.id)
      .eq('status', 'pending');

    if (error) {
      return NextResponse.json({ error: '요청 응답 처리에 실패했습니다.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[mentor/requests PATCH]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

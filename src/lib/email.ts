import { Resend } from 'resend';

interface SendMatchingRequestEmailParams {
  to: string;
  mentorName: string;
  branchName: string;
  subjects: string[];
  preferredDays: string[];
  proposedWage: string | null;
  message: string;
}

export async function sendMatchingRequestEmail({
  to,
  mentorName,
  branchName,
  subjects,
  preferredDays,
  proposedWage,
  message,
}: SendMatchingRequestEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info('[Email Skipped] RESEND_API_KEY가 설정되지 않아 이메일 발송을 건너뜁니다.', {
      to,
      branchName,
    });
    return { sent: false, reason: 'missing_api_key' as const };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || '247멘토단 <onboarding@resend.dev>';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `[247멘토단] ${branchName} 지점에서 멘토링 요청이 도착했습니다`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; color: #111827;">
        <h2 style="margin: 0 0 12px; font-size: 20px; color: #1d4ed8;">[247멘토단] 새로운 멘토링 요청</h2>
        <p style="margin: 0 0 16px; line-height: 1.6;">
          안녕하세요, <strong>${mentorName}</strong> 멘토님.<br/>
          <strong>${branchName}</strong> 지점에서 멘토링 매칭 요청을 보냈습니다.
        </p>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
          <div><strong>요청 과목:</strong> ${subjects.join(', ') || '협의'}</div>
          <div><strong>희망 요일:</strong> ${preferredDays.join(', ') || '협의'}</div>
          <div><strong>제시 급여:</strong> ${proposedWage || '지점 협의'}</div>
          <div style="margin-top: 8px;"><strong>지점 메시지:</strong><br/>${message.replace(/\n/g, '<br/>')}</div>
        </div>
        <p style="margin: 0 0 20px; font-size: 13px; color: #4b5563;">
          * 요청을 <strong>수락</strong>하시면 지점 담당자에게 멘토님의 연락처가 공개되며, 멘토님도 지점 담당자 연락처를 확인하실 수 있습니다.
        </p>
        <a href="${appUrl}/mentor" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          웹페이지에서 요청 확인 및 수락/거절하기
        </a>
      </div>
    `,
  });

  if (error) {
    console.error('[Email Error]', error);
    return { sent: false, reason: 'send_failed' as const, error };
  }

  return { sent: true as const };
}

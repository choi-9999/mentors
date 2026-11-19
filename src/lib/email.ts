import nodemailer from 'nodemailer';

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
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    console.info(
      '[Email Skipped] GMAIL_USER 또는 GMAIL_APP_PASSWORD가 설정되지 않아 이메일 발송을 건너뜁니다.',
      { to, branchName }
    );
    return { sent: false, reason: 'missing_credentials' as const };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    await transporter.sendMail({
      from: `247멘토단 <${gmailUser}>`,
      to,
      subject: `[247멘토단] ${branchName} 지점에서 멘토링 요청이 도착했습니다`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; color: #111827;">
          <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f766e;">[247멘토단] 새로운 멘토링 요청</h2>
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
          <a href="${appUrl}/mentor" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 9999px; font-weight: 600; font-size: 14px;">
            웹페이지에서 요청 확인 및 수락/거절하기
          </a>
        </div>
      `,
    });

    return { sent: true as const };
  } catch (error) {
    console.error('[Email Error]', error);
    return { sent: false, reason: 'send_failed' as const, error };
  }
}

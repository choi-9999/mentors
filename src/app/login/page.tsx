'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AntigravityCanvas } from '@/components/AntigravityCanvas';

type LoginTabRole = 'mentor' | 'branch' | 'admin';

const ROLE_META: Record<
  LoginTabRole,
  {
    label: string;
    badge: string;
    headline: string;
    description: string;
    placeholderEmail: string;
    helperText: string;
    glow: string;
  }
> = {
  mentor: {
    label: '멘토',
    badge: '247MENTORS',
    headline: '내 스펙과 가능 지점을\n가장 스마트하게 관리하세요',
    description:
      '지점에서 도착한 멘토링 요청을 확인하고, 수락 시에만 연락처가 안전하게 공개됩니다.',
    placeholderEmail: 'mentor@example.com',
    helperText: '초대 코드로 가입한 멘토 이메일과 비밀번호를 입력하세요.',
    glow: 'rgba(15, 118, 110, 0.16)',
  },
  branch: {
    label: '지점',
    badge: 'NATIONWIDE BRANCH',
    headline: '우리 지점에 딱 맞는\n247멘토단을 바로 찾으세요',
    description:
      '과목·성별·요일·시급 구간으로 필터링하고, 원하는 멘토에게 즉시 요청을 보낼 수 있습니다.',
    placeholderEmail: 'branch@example.com',
    helperText: '본사에서 사전 발급된 지점 전용 계정으로 로그인해 주세요.',
    glow: 'rgba(101, 163, 13, 0.16)',
  },
  admin: {
    label: '본사',
    badge: 'HQ ADMIN',
    headline: '전국 지점 매칭 현황을\n한눈에 파악하고 관리하세요',
    description:
      '지점별 요청/매칭 통계, 미응답 멘토 알림톡 지원, 지점 계정 및 초대 코드를 통합 관리합니다.',
    placeholderEmail: 'admin@example.com',
    helperText: '이투스247 본사 관리자 계정으로 로그인해 주세요.',
    glow: 'rgba(2, 132, 199, 0.16)',
  },
};

export default function LoginPage() {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, opacity: 0 });

  const [selectedRole, setSelectedRole] = useState<LoginTabRole>('mentor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const meta = ROLE_META[selectedRole];

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpotlight({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  }

  function handleMouseLeave() {
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes('email not confirmed')) {
          setError(
            '이메일 인증이 완료되지 않았습니다. Supabase Users에서 해당 계정의 Confirm 처리를 해주세요.'
          );
        } else {
          setError(`이메일 또는 비밀번호가 올바르지 않습니다. (${signInError.message})`);
        }
        return;
      }

      window.location.replace(`${window.location.origin}/`);
    } catch {
      setError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-12">
      <AntigravityCanvas />

      <div className="relative z-10 w-full max-w-4xl">
        {/* 상단 ← 메인으로 돌아가기 */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            메인으로
          </Link>
        </div>

        {/* 스포트라이트 + 좌우 분할(다크/글래스) 로그인 카드 */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="group relative grid overflow-hidden rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 md:grid-cols-[1fr_1.15fr]"
        >
          {/* 마우스 트래킹 스포트라이트 오버레이 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px z-20 rounded-3xl transition-opacity duration-300"
            style={{
              opacity: spotlight.opacity,
              background: `radial-gradient(460px circle at ${spotlight.x}px ${spotlight.y}px, ${meta.glow}, transparent 68%)`,
            }}
          />

          {/* 좌측: 다크 브랜드 쇼케이스 패널 */}
          <div className="relative flex flex-col justify-between overflow-hidden bg-slate-950/95 p-8 text-white backdrop-blur-2xl sm:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal-600/20 blur-3xl"
            />

            <div>
              <Link href="/" className="inline-flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/etoos247-bi-white.png"
                  alt="이투스247학원"
                  className="h-8 w-auto object-contain"
                />
              </Link>

              <div className="mt-8">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wider text-teal-300">
                  <Sparkles className="h-3 w-3" />
                  {meta.badge}
                </span>
                <h2 className="mt-4 whitespace-pre-line text-2xl font-bold leading-snug tracking-tight text-white">
                  {meta.headline}
                </h2>
                <p className="mt-3 text-xs leading-relaxed text-slate-400 sm:text-sm">
                  {meta.description}
                </p>
              </div>
            </div>

            <div className="mt-10 border-t border-white/10 pt-5 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">247MENTORS</p>
              <p className="mt-0.5">이투스247학원 전국 지점 공식 매칭 시스템</p>
            </div>
          </div>

          {/* 우측: 반투명 글래스 로그인 폼 */}
          <div className="relative z-10 bg-white/75 p-8 backdrop-blur-2xl sm:p-10">
            {/* 역할 전환 세그먼트 탭 */}
            <div className="mb-6 inline-flex w-full rounded-full border border-slate-200/80 bg-slate-100/80 p-1">
              {(['mentor', 'branch', 'admin'] as LoginTabRole[]).map((role) => {
                const active = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'bg-slate-950 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {ROLE_META[role].label}
                  </button>
                );
              })}
            </div>

            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight text-slate-950">
                {meta.label} 로그인
              </h1>
              <p className="mt-1 text-xs text-slate-500">{meta.helperText}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  이메일
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={meta.placeholderEmail}
                  className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full rounded-xl border border-slate-300/90 bg-white/90 py-2.5 pl-3.5 pr-10 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                로그인
              </button>
            </form>

            <div className="mt-6 space-y-2 border-t border-slate-200/70 pt-5 text-center text-xs text-slate-600">
              <p>
                247멘토단 소속이신가요?{' '}
                <Link href="/signup" className="font-semibold text-teal-700 hover:underline">
                  초대 코드로 회원가입
                </Link>
              </p>
              <p className="text-[11px] text-slate-400">
                지점 계정은 본사에서 사전 발급된 아이디/비밀번호로 로그인해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

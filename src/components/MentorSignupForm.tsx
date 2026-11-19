'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import {
  DAYS,
  ENROLLMENT_STATUSES,
  GENDERS,
  SUBJECTS,
  WAGE_TIERS,
} from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import type { Branch } from '@/lib/types';
import { BranchRegionSelector } from './BranchRegionSelector';

interface MentorSignupFormProps {
  branches: Branch[];
  initialInviteCode?: string;
}

const STEPS = [
  { id: 1, title: '초대 코드 · 계정', desc: '초대 코드 및 로그인 정보' },
  { id: 2, title: '기본 정보 · 학력', desc: '연락처 및 대학·학과' },
  { id: 3, title: '멘토링 조건', desc: '과목·요일·시급 구간' },
  { id: 4, title: '활동 가능 지점', desc: '전국 출강 가능 지점 선택' },
] as const;

export function MentorSignupForm({ branches, initialInviteCode = '' }: MentorSignupFormProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, opacity: 0 });

  const [step, setStep] = useState(1);
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'남성' | '여성'>('남성');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState<'재학' | '휴학' | '졸업'>('재학');

  const [subjects, setSubjects] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [hourlyWageTier, setHourlyWageTier] = useState<string>('2~3만 원');
  const [wageNote, setWageNote] = useState('');
  const [bio, setBio] = useState('');

  const [branchIds, setBranchIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  function toggleItem(list: string[], value: string, setter: (v: string[]) => void) {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  }

  function validateStep(currentStep: number): string | null {
    if (currentStep === 1) {
      if (!inviteCode.trim()) return '본사 발급 초대 코드를 입력해주세요.';
      if (!email.trim() || !email.includes('@')) return '올바른 이메일을 입력해주세요.';
      if (password.length < 6) return '비밀번호는 6자 이상 입력해주세요.';
    }
    if (currentStep === 2) {
      if (!name.trim()) return '이름을 입력해주세요.';
      if (!phone.trim()) return '연락처를 입력해주세요.';
      if (!university.trim() || !major.trim()) return '대학과 학과를 모두 입력해주세요.';
    }
    if (currentStep === 3) {
      if (!subjects.length) return '멘토링 가능 과목을 최소 1개 이상 선택해주세요.';
      if (!availableDays.length) return '활동 가능 요일을 최소 1개 이상 선택해주세요.';
    }
    if (currentStep === 4) {
      if (!branchIds.length) {
        return '활동 가능 지점을 최소 1개 이상 선택해주세요.';
      }
    }
    return null;
  }

  function handleNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(4, prev + 1));
  }

  function handlePrev() {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateStep(4);
    if (err) {
      setError(err);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/mentor-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode,
          email,
          password,
          name,
          phone,
          gender,
          university,
          major,
          enrollment_status: enrollmentStatus,
          subjects,
          available_days: availableDays,
          hourly_wage_tier: hourlyWageTier,
          wage_note: wageNote,
          bio,
          branch_ids: branchIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '회원가입에 실패했습니다.');
        return;
      }

      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email: email.trim(), password });
      router.push('/mentor');
      router.refresh();
    } catch {
      setError('요청 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative grid overflow-hidden rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 lg:grid-cols-[330px_1fr]"
    >
      {/* 마우스 트래킹 스포트라이트 오버레이 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px z-20 rounded-3xl transition-opacity duration-300"
        style={{
          opacity: spotlight.opacity,
          background: `radial-gradient(500px circle at ${spotlight.x}px ${spotlight.y}px, rgba(15, 118, 110, 0.14), transparent 68%)`,
        }}
      />

      {/* 좌측: 다크 사이드바 (화이트 BI + 4단계 진행률 + 실시간 미니 프리뷰) */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-slate-950/95 p-7 text-white backdrop-blur-2xl sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal-600/20 blur-3xl"
        />

        <div>
          <Link href="/" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/etoos247-bi-white.png"
              alt="이투스247학원"
              className="h-8 w-auto object-contain"
            />
          </Link>

          <div className="mt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wider text-teal-300">
              <Sparkles className="h-3 w-3" />
              247MENTORS SIGN UP
            </span>
            <h1 className="mt-3 text-xl font-bold tracking-tight text-white">
              247멘토단 회원가입
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              4단계만 입력하면 전국 지점 매칭이 시작됩니다.
            </p>
          </div>

          {/* 4단계 진행 스텝퍼 */}
          <ol className="mt-7 space-y-3">
            {STEPS.map((s) => {
              const isDone = step > s.id;
              const isCurrent = step === s.id;
              return (
                <li
                  key={s.id}
                  onClick={() => {
                    if (s.id < step) {
                      setError(null);
                      setStep(s.id);
                    }
                  }}
                  className={`flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition ${
                    isCurrent
                      ? 'border-teal-500/50 bg-white/10'
                      : isDone
                        ? 'cursor-pointer border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                        : 'border-transparent opacity-45'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isDone
                        ? 'bg-teal-500 text-slate-950'
                        : isCurrent
                          ? 'bg-white text-slate-950'
                          : 'border border-white/25 text-white'
                    }`}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">{s.title}</p>
                    <p className="truncate text-[11px] text-slate-400">{s.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* 실시간 입력 프리뷰 카드 */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-300">
            실시간 프로필 미리보기
          </p>
          <p className="mt-1.5 text-sm font-bold text-white">
            {name.trim() || '멘토 이름'}{' '}
            <span className="text-xs font-normal text-slate-400">· {gender}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-300">
            {university.trim() || '대학명'} {major.trim() ? `· ${major.trim()}` : ''} (
            {enrollmentStatus})
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {subjects.length > 0 ? (
              subjects.map((subj) => (
                <span
                  key={subj}
                  className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-semibold text-teal-200"
                >
                  {subj}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-500">과목 미선택</span>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
            <MapPin className="h-3 w-3 text-teal-400" />
            지점 {branchIds.length}개 선택됨
          </p>
        </div>
      </aside>

      {/* 우측: 반투명 글래스 스텝 폼 */}
      <div className="relative z-10 flex flex-col justify-between bg-white/75 p-6 backdrop-blur-2xl sm:p-9">
        <form onSubmit={handleSubmit} className="flex h-full flex-col justify-between space-y-6">
          <div>
            {/* 상단 프로그레스 바 */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>
                  STEP {step} / 4 · {STEPS[step - 1].title}
                </span>
                <span className="text-teal-700">{step * 25}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className="h-full rounded-full bg-teal-700 transition-all duration-300"
                  style={{ width: `${step * 25}%` }}
                />
              </div>
            </div>

            {/* STEP 1: 초대 코드 및 계정 정보 */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-950">
                    초대 코드 및 계정 정보
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    본사에서 전달받은 초대 코드와 알림을 받을 이메일을 입력해 주세요.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    본사 발급 초대 코드 *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="예: 247MENTOR2026"
                    className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    이메일 (알림 수신 및 로그인 ID) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mentor@example.com"
                    className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    비밀번호 (6자 이상) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="6자 이상 입력하세요"
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
              </div>
            )}

            {/* STEP 2: 멘토 기본 정보 & 학력 */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-950">
                    멘토 기본 정보 & 학력
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    연락처와 이메일은 지점 요청을 수락하기 전까지 지점에 공개되지 않습니다.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">이름 *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="홍길동"
                      className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">연락처 *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010-1234-5678"
                      className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">성별 *</label>
                    <div className="flex gap-2">
                      {GENDERS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`flex-1 rounded-full border py-2 text-xs font-semibold transition ${
                            gender === g
                              ? 'border-teal-700 bg-teal-700 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      학적 상태 *
                    </label>
                    <div className="flex gap-2">
                      {ENROLLMENT_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setEnrollmentStatus(status)}
                          className={`flex-1 rounded-full border py-2 text-xs font-semibold transition ${
                            enrollmentStatus === status
                              ? 'border-teal-700 bg-teal-700 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">대학 *</label>
                    <input
                      type="text"
                      required
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="예: 서울대학교"
                      className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">학과 *</label>
                    <input
                      type="text"
                      required
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="예: 수학교육과"
                      className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: 멘토링 가능 과목 및 조건 */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-950">
                    멘토링 가능 과목 및 조건
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    지점에서 필터링할 때 기준으로 사용되는 항목입니다.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    멘토링 가능 과목 / 전형 (복수 선택) *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((subj) => {
                      const active = subjects.includes(subj);
                      return (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => toggleItem(subjects, subj, setSubjects)}
                          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                            active
                              ? 'border-teal-700 bg-teal-700 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {subj}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    활동 가능 요일 (복수 선택) *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => {
                      const active = availableDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleItem(availableDays, day, setAvailableDays)}
                          className={`h-9 w-9 rounded-full border text-xs font-semibold transition ${
                            active
                              ? 'border-teal-700 bg-teal-700 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      희망 시급 구간 *
                    </label>
                    <select
                      value={hourlyWageTier}
                      onChange={(e) => setHourlyWageTier(e.target.value)}
                      className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-teal-700"
                    >
                      {WAGE_TIERS.map((tier) => (
                        <option key={tier} value={tier}>
                          {tier}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      급여/시간대 상세 메모 (선택)
                    </label>
                    <input
                      type="text"
                      value={wageNote}
                      onChange={(e) => setWageNote(e.target.value)}
                      placeholder="예: 평일 저녁 6시 이후 가능"
                      className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-teal-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    자기소개 및 멘토링 강점 (선택)
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="수능/내신 성적, 입시 경험, 지도 스타일 등을 자유롭게 작성해주세요."
                    className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-teal-700"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: 활동 가능 지점 선택 */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-950">
                    활동 가능 지점 선택 ({branchIds.length}개)
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    출강 가능한 지점을 모두 선택해 주세요.
                  </p>
                </div>

                <div className="max-h-[420px] overflow-y-auto pr-1">
                  <BranchRegionSelector
                    branches={branches}
                    selectedIds={branchIds}
                    onChange={setBranchIds}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-slate-200/70 pt-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    이전
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="text-xs font-medium text-slate-500 hover:text-slate-900"
                  >
                    이미 계정이 있으신가요?{' '}
                    <span className="font-semibold text-teal-700">로그인</span>
                  </Link>
                )}
              </div>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  다음 단계
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  멘토 등록 완료하기
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

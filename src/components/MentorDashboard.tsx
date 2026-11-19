'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  LogOut,
  Phone,
  Save,
  UserCog,
  XCircle,
} from 'lucide-react';
import {
  DAYS,
  ENROLLMENT_STATUSES,
  GENDERS,
  SUBJECTS,
  WAGE_TIERS,
} from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { getUniversityTheme } from '@/lib/universities';
import type { Branch, MatchingRequest, MentorProfile, Profile } from '@/lib/types';
import { AntigravityCanvas } from './AntigravityCanvas';
import { BranchRegionSelector } from './BranchRegionSelector';
import { SpotlightCard } from './SpotlightCard';

export interface MentorRequestWithBranch extends MatchingRequest {
  branch: Pick<Branch, 'id' | 'region' | 'name'> | null;
}

interface MentorDashboardProps {
  profile: Profile;
  mentorProfile: MentorProfile;
  selectedBranchIds: string[];
  branches: Branch[];
  requests: MentorRequestWithBranch[];
}

const REQUEST_RAYS = [
  { angle: 0, len: 18, r: 42, color: '#2dd4bf' },
  { angle: 30, len: 24, r: 58, color: '#f97316' },
  { angle: 60, len: 14, r: 46, color: '#38bdf8' },
  { angle: 90, len: 22, r: 64, color: '#a3e635' },
  { angle: 120, len: 16, r: 48, color: '#2dd4bf' },
  { angle: 150, len: 26, r: 60, color: '#fb923c' },
  { angle: 180, len: 14, r: 44, color: '#38bdf8' },
  { angle: 210, len: 20, r: 56, color: '#a3e635' },
  { angle: 240, len: 16, r: 46, color: '#2dd4bf' },
  { angle: 270, len: 24, r: 62, color: '#f97316' },
  { angle: 300, len: 18, r: 48, color: '#38bdf8' },
  { angle: 330, len: 22, r: 58, color: '#a3e635' },
];

export function MentorDashboard({
  profile,
  mentorProfile,
  selectedBranchIds,
  branches,
  requests,
}: MentorDashboardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'requests' | 'profile'>('requests');

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({});

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [gender, setGender] = useState(mentorProfile.gender);
  const [university, setUniversity] = useState(mentorProfile.university);
  const [major, setMajor] = useState(mentorProfile.major);
  const [enrollmentStatus, setEnrollmentStatus] = useState(mentorProfile.enrollment_status);
  const [subjects, setSubjects] = useState<string[]>(mentorProfile.subjects);
  const [availableDays, setAvailableDays] = useState<string[]>(mentorProfile.available_days);
  const [hourlyWageTier, setHourlyWageTier] = useState<string>(mentorProfile.hourly_wage_tier);
  const [wageNote, setWageNote] = useState(mentorProfile.wage_note ?? '');
  const [bio, setBio] = useState(mentorProfile.bio ?? '');
  const [isRecruiting, setIsRecruiting] = useState(mentorProfile.is_recruiting);
  const [branchIds, setBranchIds] = useState<string[]>(selectedBranchIds);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const uni = getUniversityTheme(university);

  function toggleItem(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((i) => i !== value) : [...list, value]);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace(`${window.location.origin}/login`);
  }

  async function handleRespond(requestId: string, status: 'accepted' | 'rejected') {
    setRespondingId(requestId);
    try {
      const res = await fetch(`/api/mentor/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reject_reason: rejectReasonMap[requestId] ?? '',
        }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setRespondingId(null);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch('/api/mentor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          is_recruiting: isRecruiting,
          branch_ids: branchIds,
        }),
      });

      if (res.ok) {
        setSaveMessage('프로필 및 가능 지점이 저장되었습니다.');
        router.refresh();
      } else {
        setSaveMessage('저장에 실패했습니다. 입력 내용을 확인해주세요.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      {/* 상단 반투명 글래스 헤더 */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-4 sm:px-6">
          <Link href="/mentor" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/etoos247-bi.png"
              alt="이투스247학원"
              className="h-7 w-auto object-contain"
            />
            <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" />
            <span className="hidden text-sm font-semibold tracking-tight text-slate-700 sm:inline">
              247MENTORS
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-teal-200/80 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
              247멘토단
            </span>
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">{profile.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
            >
              <LogOut className="h-3.5 w-3.5" />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 에디토리얼 히어로 섹션 (히어로 한정 마우스 파티클 + 대학 CI 엠블럼) */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white py-14 sm:py-16">
        <AntigravityCanvas scoped />
        <div className="relative z-10 mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-6 px-4 sm:px-6">
          <div className="flex items-start gap-4 sm:items-center">
            {uni.logo && (
              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-slate-200/80 bg-white/95 p-2.5 shadow-sm sm:flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uni.logo}
                  alt={university}
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl sm:leading-[1.15]">
                {profile.name} 멘토님,
                <br />
                <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-lime-600 bg-clip-text text-transparent">
                  요청과 스펙을 관리하세요
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur">
            <span
              className={`h-2 w-2 rounded-full ${
                mentorProfile.is_recruiting ? 'bg-teal-600' : 'bg-slate-400'
              }`}
            />
            {mentorProfile.is_recruiting ? '현재 활동 가능 (지점 검색 노출 중)' : '일시 중단 (검색 미노출)'}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6">
        {/* Antigravity Use-Cases 스타일 다크 애니메이션 탭 카드 2개 */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {/* 카드 1: 받은 멘토링 요청 */}
          <button
            type="button"
            onClick={() => setTab('requests')}
            className={`group relative flex min-h-[195px] flex-col justify-between overflow-hidden rounded-3xl border bg-[#060B16] p-6 text-left transition duration-300 hover:-translate-y-1 ${
              tab === 'requests'
                ? 'border-teal-400/70 ring-2 ring-teal-400/30 shadow-xl shadow-slate-950/20'
                : 'border-slate-800/80 hover:border-slate-700 shadow-lg shadow-slate-950/10'
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 240 200"
              className="pointer-events-none absolute -right-4 -top-4 h-48 w-56 opacity-75 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12"
            >
              <g transform="translate(135, 90)">
                {REQUEST_RAYS.map((ray, i) => (
                  <g key={i} transform={`rotate(${ray.angle})`}>
                    <line
                      x1={ray.r}
                      y1={0}
                      x2={ray.r + ray.len}
                      y2={0}
                      stroke={ray.color}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      opacity={tab === 'requests' ? 0.95 : 0.6}
                    />
                  </g>
                ))}
              </g>
            </svg>

            <div className="relative z-10 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-500/10 text-teal-300">
                <Inbox className="h-5 w-5" />
              </span>
              {pendingCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-0.5 text-xs font-bold text-amber-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  응답 대기 {pendingCount}건
                </span>
              ) : (
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-xs font-semibold text-slate-300">
                  전체 {requests.length}건
                </span>
              )}
            </div>

            <div className="relative z-10 mt-6">
              <h2 className="text-lg font-bold tracking-tight text-white">받은 멘토링 요청</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                전국 지점에서 도착한 요청을 확인하고 수락 시 연락처를 상호 공개합니다.
              </p>
            </div>
          </button>

          {/* 카드 2: 내 스펙 · 지점 관리 */}
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`group relative flex min-h-[195px] flex-col justify-between overflow-hidden rounded-3xl border bg-[#060B16] p-6 text-left transition duration-300 hover:-translate-y-1 ${
              tab === 'profile'
                ? 'border-teal-400/70 ring-2 ring-teal-400/30 shadow-xl shadow-slate-950/20'
                : 'border-slate-800/80 hover:border-slate-700 shadow-lg shadow-slate-950/10'
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 240 180"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-80 transition-transform duration-700 group-hover:scale-110"
            >
              <g transform="translate(175, 72)">
                <circle r="18" fill="none" stroke="rgba(56,189,248,0.28)" strokeWidth="1" />
                <circle r="36" fill="none" stroke="rgba(56,189,248,0.20)" strokeWidth="1" />
                <circle r="54" fill="none" stroke="rgba(56,189,248,0.14)" strokeWidth="1" />
                <circle r="72" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="1" />
                <circle cx="0" cy="0" r="3.5" fill="#7dd3fc" className="animate-pulse" />
              </g>
            </svg>

            <div className="relative z-10 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/10 text-sky-300">
                <UserCog className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-xs font-semibold text-teal-300">
                가능 지점 {branchIds.length}개
              </span>
            </div>

            <div className="relative z-10 mt-6">
              <h2 className="text-lg font-bold tracking-tight text-white">내 스펙 · 지점 관리</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                가능 과목, 요일, 희망 시급, 출강 가능 지점 및 활동 상태를 수정합니다.
              </p>
            </div>
          </button>
        </div>

        {tab === 'requests' ? (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <Inbox className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  아직 도착한 멘토링 요청이 없습니다.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  지점에서 요청을 보내면 등록하신 이메일({profile.email})로 알림이 발송됩니다.
                </p>
              </div>
            ) : (
              requests.map((req) => (
                <SpotlightCard
                  key={req.id}
                  glowColor={uni.glowColor}
                  className="bg-white/85 p-6 backdrop-blur-xl"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-base font-bold tracking-tight text-slate-950">
                          {req.branch ? `${req.branch.region} · ${req.branch.name} 지점` : '지점 요청'}
                        </span>
                        {req.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            <Clock className="h-3 w-3" /> 응답 대기 중
                          </span>
                        )}
                        {req.status === 'accepted' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                            <CheckCircle2 className="h-3 w-3" /> 수락됨 (연락처 공개)
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            <XCircle className="h-3 w-3" /> 거절함
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        요청일시: {new Date(req.created_at).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700 sm:grid-cols-3">
                    <div>
                      <span className="text-xs text-slate-500">요청 과목</span>
                      <p className="font-semibold text-slate-900">
                        {req.subjects.join(', ') || '협의'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">희망 요일</span>
                      <p className="font-semibold text-slate-900">
                        {req.preferred_days.join(', ') || '협의'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">제시 급여</span>
                      <p className="font-semibold text-slate-900">
                        {req.proposed_wage || '지점 협의'}
                      </p>
                    </div>
                    <div className="mt-1 border-t border-slate-200/80 pt-3 sm:col-span-3">
                      <span className="text-xs text-slate-500">지점 전달 메시지</span>
                      <p className="mt-0.5 whitespace-pre-wrap text-slate-800">{req.message}</p>
                    </div>
                  </div>

                  {req.status === 'accepted' && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-teal-200/80 bg-teal-50/60 px-4 py-3 text-sm text-teal-950">
                      <Phone className="h-4 w-4 text-teal-700" />
                      <span>
                        <strong>지점 담당자:</strong> {req.branch_contact_name} (
                        {req.branch_contact_phone})
                      </span>
                    </div>
                  )}

                  {req.status === 'pending' && (
                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <input
                        type="text"
                        value={rejectReasonMap[req.id] ?? ''}
                        onChange={(e) =>
                          setRejectReasonMap((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        placeholder="거절 시 사유를 남기려면 입력 (선택)"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-teal-600"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={respondingId === req.id}
                          onClick={() => handleRespond(req.id, 'rejected')}
                          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          거절하기
                        </button>
                        <button
                          type="button"
                          disabled={respondingId === req.id}
                          onClick={() => handleRespond(req.id, 'accepted')}
                          className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          {respondingId === req.id && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          )}
                          수락하고 연락처 공개하기
                        </button>
                      </div>
                    </div>
                  )}
                </SpotlightCard>
              ))
            )}
          </div>
        ) : (
          <SpotlightCard
            glowColor={uni.glowColor}
            topAccentColor={uni.accentColor}
            className="bg-white/85 p-6 pt-7 backdrop-blur-xl hover:translate-y-0 sm:p-8"
          >
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  {uni.logo && (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={uni.logo} alt={university} className="h-full w-full object-contain" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-slate-950">
                      내 스펙 및 활동 상태
                    </h2>
                    <p className="text-xs text-slate-500">이메일: {profile.email}</p>
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isRecruiting}
                    onChange={(e) => setIsRecruiting(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  멘토링 활동 중 (지점 검색 노출)
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">이름</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">연락처</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">성별</label>
                  <div className="flex gap-2">
                    {GENDERS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 rounded-full border py-2.5 text-sm font-medium transition ${
                          gender === g
                            ? 'border-teal-700 bg-teal-50 text-teal-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">학적 상태</label>
                  <div className="flex gap-2">
                    {ENROLLMENT_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEnrollmentStatus(s)}
                        className={`flex-1 rounded-full border py-2.5 text-sm font-medium transition ${
                          enrollmentStatus === s
                            ? 'border-teal-700 bg-teal-50 text-teal-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">대학</label>
                  <input
                    type="text"
                    required
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">학과</label>
                  <input
                    type="text"
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">가능 과목</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => toggleItem(subjects, subj, setSubjects)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                        subjects.includes(subj)
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">가능 요일</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleItem(availableDays, day, setAvailableDays)}
                      className={`h-9 w-9 rounded-full border text-sm font-medium transition ${
                        availableDays.includes(day)
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    희망 시급 구간
                  </label>
                  <select
                    value={hourlyWageTier}
                    onChange={(e) => setHourlyWageTier(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-600"
                  >
                    {WAGE_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    급여/시간 메모
                  </label>
                  <input
                    type="text"
                    value={wageNote}
                    onChange={(e) => setWageNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">자기소개</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-600"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  활동 가능 지점 ({branchIds.length}개 선택됨)
                </label>
                <BranchRegionSelector
                  branches={branches}
                  selectedIds={branchIds}
                  onChange={setBranchIds}
                />
              </div>

              {saveMessage && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-900">
                  {saveMessage}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  변경사항 저장
                </button>
              </div>
            </form>
          </SpotlightCard>
        )}
      </main>
    </div>
  );
}

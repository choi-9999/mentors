'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import { DAYS, SUBJECTS, WAGE_TIERS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { getUniversityTheme } from '@/lib/universities';
import type { Branch, MatchingRequest, MentorDirectoryItem } from '@/lib/types';
import { AntigravityCanvas } from './AntigravityCanvas';
import { SpotlightCard } from './SpotlightCard';

export interface BranchSentRequest extends MatchingRequest {
  mentor: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    university?: string;
    major?: string;
  } | null;
}

interface BranchDashboardProps {
  userName: string;
  myBranch: Branch | null;
  mentors: MentorDirectoryItem[];
  sentRequests: BranchSentRequest[];
}

const SEARCH_RAYS = [
  { angle: 0, len: 18, r: 42, color: '#2dd4bf' },
  { angle: 30, len: 24, r: 58, color: '#38bdf8' },
  { angle: 60, len: 14, r: 46, color: '#a3e635' },
  { angle: 90, len: 22, r: 64, color: '#2dd4bf' },
  { angle: 120, len: 16, r: 48, color: '#38bdf8' },
  { angle: 150, len: 26, r: 60, color: '#f97316' },
  { angle: 180, len: 14, r: 44, color: '#2dd4bf' },
  { angle: 210, len: 20, r: 56, color: '#a3e635' },
  { angle: 240, len: 16, r: 46, color: '#38bdf8' },
  { angle: 270, len: 24, r: 62, color: '#2dd4bf' },
  { angle: 300, len: 18, r: 48, color: '#f97316' },
  { angle: 330, len: 22, r: 58, color: '#a3e635' },
];

export function BranchDashboard({
  userName,
  myBranch,
  mentors,
  sentRequests,
}: BranchDashboardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'search' | 'sent'>('search');

  const [showNearbyRegion, setShowNearbyRegion] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState<string>('전체');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedWageTiers, setSelectedWageTiers] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [onlyRecruiting, setOnlyRecruiting] = useState(true);

  const [modalMentor, setModalMentor] = useState<MentorDirectoryItem | null>(null);
  const [reqSubjects, setReqSubjects] = useState<string[]>([]);
  const [reqDays, setReqDays] = useState<string[]>([]);
  const [reqWage, setReqWage] = useState('');
  const [reqContactName, setReqContactName] = useState('');
  const [reqContactPhone, setReqContactPhone] = useState('');
  const [reqMessage, setReqMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<string | null>(null);

  const acceptedCount = sentRequests.filter((r) => r.status === 'accepted').length;

  function toggleFilter(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((i) => i !== value) : [...list, value]);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace(`${window.location.origin}/login`);
  }

  const filteredMentors = useMemo(() => {
    return mentors.filter((m) => {
      if (onlyRecruiting && !m.is_recruiting) return false;
      if (selectedGender !== '전체' && m.gender !== selectedGender) return false;

      if (myBranch) {
        if (showNearbyRegion) {
          const matchesRegion = m.branches.some((b) => b.region === myBranch.region);
          if (!matchesRegion) return false;
        } else {
          const matchesBranch = m.branch_ids.includes(myBranch.id);
          if (!matchesBranch) return false;
        }
      }

      if (
        selectedSubjects.length > 0 &&
        !selectedSubjects.some((subj) => m.subjects.includes(subj as never))
      ) {
        return false;
      }

      if (
        selectedDays.length > 0 &&
        !selectedDays.some((day) => m.available_days.includes(day as never))
      ) {
        return false;
      }

      if (
        selectedWageTiers.length > 0 &&
        !selectedWageTiers.includes(m.hourly_wage_tier)
      ) {
        return false;
      }

      if (keyword.trim()) {
        const q = keyword.trim().toLowerCase();
        const target = `${m.name} ${m.university} ${m.major} ${m.bio ?? ''}`.toLowerCase();
        if (!target.includes(q)) return false;
      }

      return true;
    });
  }, [
    mentors,
    onlyRecruiting,
    selectedGender,
    showNearbyRegion,
    myBranch,
    selectedSubjects,
    selectedDays,
    selectedWageTiers,
    keyword,
  ]);

  function openRequestModal(mentor: MentorDirectoryItem) {
    setModalMentor(mentor);
    setReqSubjects(mentor.subjects.slice(0, 2));
    setReqDays(mentor.available_days);
    setReqWage(mentor.hourly_wage_tier);
    setReqMessage('');
    setSendFeedback(null);
  }

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!modalMentor) return;
    setSending(true);
    setSendFeedback(null);

    try {
      const res = await fetch('/api/branch/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentor_id: modalMentor.id,
          subjects: reqSubjects,
          preferred_days: reqDays,
          proposed_wage: reqWage,
          branch_contact_name: reqContactName,
          branch_contact_phone: reqContactPhone,
          message: reqMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendFeedback(data.error || '요청 전송에 실패했습니다.');
        return;
      }
      setModalMentor(null);
      setTab('sent');
      router.refresh();
    } catch {
      setSendFeedback('요청 전송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      {/* 상단 반투명 글래스 헤더 */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-4 sm:px-6">
          <Link href="/branch" className="flex items-center gap-3">
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
            <span className="inline-flex items-center rounded-full border border-lime-200/80 bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-800">
              지점 담당자{myBranch ? ` · ${myBranch.name}` : ''}
            </span>
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">{userName}</span>
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

      {/* 에디토리얼 히어로 섹션 (히어로 한정 마우스 파티클) */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white py-14 sm:py-16">
        <AntigravityCanvas scoped />
        <div className="relative z-10 mx-auto max-w-[1360px] px-4 sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl sm:leading-[1.15]">
            {myBranch ? `${myBranch.name} 지점` : '우리 지점'}에 딱 맞는 멘토를
            <br />
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-lime-600 bg-clip-text text-transparent">
              가장 빠르게 찾으세요
            </span>
          </h1>
        </div>
      </section>

      <main className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6">
        {/* Antigravity Use-Cases 스타일 다크 애니메이션 탭 카드 2개 */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {/* 카드 1: 멘토 찾기 */}
          <button
            type="button"
            onClick={() => setTab('search')}
            className={`group relative flex min-h-[195px] flex-col justify-between overflow-hidden rounded-3xl border bg-[#060B16] p-6 text-left transition duration-300 hover:-translate-y-1 ${
              tab === 'search'
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
                {SEARCH_RAYS.map((ray, i) => (
                  <g key={i} transform={`rotate(${ray.angle})`}>
                    <line
                      x1={ray.r}
                      y1={0}
                      x2={ray.r + ray.len}
                      y2={0}
                      stroke={ray.color}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      opacity={tab === 'search' ? 0.95 : 0.6}
                    />
                  </g>
                ))}
              </g>
            </svg>

            <div className="relative z-10 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-500/10 text-teal-300">
                <Search className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-xs font-semibold text-teal-300">
                검색 결과 {filteredMentors.length}명
              </span>
            </div>

            <div className="relative z-10 mt-6">
              <h2 className="text-lg font-bold tracking-tight text-white">247멘토단 찾기</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                지점·과목·성별·요일·시급 구간으로 필터링하고 멘토링 요청을 발송합니다.
              </p>
            </div>
          </button>

          {/* 카드 2: 보낸 요청 관리 */}
          <button
            type="button"
            onClick={() => setTab('sent')}
            className={`group relative flex min-h-[195px] flex-col justify-between overflow-hidden rounded-3xl border bg-[#060B16] p-6 text-left transition duration-300 hover:-translate-y-1 ${
              tab === 'sent'
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
                <Send className="h-5 w-5" />
              </span>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                  전체 {sentRequests.length}건
                </span>
                {acceptedCount > 0 && (
                  <span className="rounded-full border border-teal-400/30 bg-teal-500/15 px-2.5 py-0.5 text-xs font-semibold text-teal-300">
                    수락 {acceptedCount}건
                  </span>
                )}
              </div>
            </div>

            <div className="relative z-10 mt-6">
              <h2 className="text-lg font-bold tracking-tight text-white">보낸 요청 관리</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                요청 응답 상태를 확인하고, 멘토가 수락한 건의 연락처를 확인합니다.
              </p>
            </div>
          </button>
        </div>

        {tab === 'search' ? (
          <div className="grid gap-7 lg:grid-cols-[320px_1fr]">
            {/* 좌측 스포트라이트 글래스 필터 패널 */}
            <aside className="h-fit">
              <SpotlightCard
                className="bg-white/80 p-6 backdrop-blur-xl hover:translate-y-0"
                glowColor="rgba(15, 118, 110, 0.12)"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-950">
                    <Filter className="h-4 w-4 text-teal-700" />
                    조건 필터
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNearbyRegion(false);
                      setSelectedSubjects([]);
                      setSelectedGender('전체');
                      setSelectedDays([]);
                      setSelectedWageTiers([]);
                      setKeyword('');
                      setOnlyRecruiting(true);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900"
                  >
                    초기화
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    대학 / 학과 / 이름 검색
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="예: 서울대, 수학과"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">조회 범위</span>
                    <span className="text-[11px] font-medium text-teal-700">
                      {showNearbyRegion
                        ? `${myBranch?.region ?? '동일'} 권역 전체`
                        : `${myBranch?.name ?? '우리'} 지점`}
                    </span>
                  </div>
                  <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={showNearbyRegion}
                      onChange={(e) => setShowNearbyRegion(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                    />
                    인근 지점 멘토도 보기
                  </label>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">성별</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['전체', '남성', '여성'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGender(g)}
                        className={`rounded-full border py-1.5 text-xs font-medium transition ${
                          selectedGender === g
                            ? 'border-teal-700 bg-teal-50 text-teal-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    과목 / 전형
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUBJECTS.map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => toggleFilter(selectedSubjects, subj, setSelectedSubjects)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          selectedSubjects.includes(subj)
                            ? 'border-teal-700 bg-teal-700 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    가능 요일
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleFilter(selectedDays, day, setSelectedDays)}
                        className={`h-8 w-8 rounded-full border text-xs font-medium transition ${
                          selectedDays.includes(day)
                            ? 'border-teal-700 bg-teal-700 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    희망 시급 구간
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {WAGE_TIERS.map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => toggleFilter(selectedWageTiers, tier, setSelectedWageTiers)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          selectedWageTiers.includes(tier)
                            ? 'border-teal-700 bg-teal-700 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                  <label className="flex cursor-pointer items-center gap-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={onlyRecruiting}
                      onChange={(e) => setOnlyRecruiting(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                    />
                    현재 활동 가능한 멘토만 보기
                  </label>
                </div>
              </SpotlightCard>
            </aside>

            {/* 우측 대학 CI 테마 적용 멘토 카드 그리드 */}
            <div className="space-y-4">
              {filteredMentors.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                  선택한 조건에 맞는 멘토가 없습니다. 필터 조건을 조금 넓혀보세요.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {filteredMentors.map((mentor) => {
                    const uni = getUniversityTheme(mentor.university);
                    return (
                      <SpotlightCard
                        key={mentor.id}
                        glowColor={uni.glowColor}
                        topAccentColor={uni.accentColor}
                        className="h-full bg-white/85 p-6 pt-7 backdrop-blur-xl"
                      >
                        {/* 은은한 대학 CI 배경 워터마크 */}
                        {uni.logo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={uni.logo}
                            alt=""
                            aria-hidden="true"
                            className="pointer-events-none absolute bottom-12 right-2 h-24 w-24 object-contain opacity-[0.045]"
                          />
                        )}

                        <div className="relative z-10 flex flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                {uni.logo && (
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={uni.logo}
                                      alt={mentor.university}
                                      className="h-full w-full object-contain"
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <h3 className="text-base font-bold tracking-tight text-slate-950">
                                      {mentor.name}
                                    </h3>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                      {mentor.gender}
                                    </span>
                                  </div>
                                  <p
                                    className="mt-1 text-sm font-semibold"
                                    style={{ color: uni.accentColor }}
                                  >
                                    {mentor.university}{' '}
                                    <span className="font-medium text-slate-600">
                                      · {mentor.major} ({mentor.enrollment_status})
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <span
                                className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold"
                                style={{
                                  backgroundColor: uni.badgeBg,
                                  color: uni.badgeText,
                                  borderColor: uni.badgeBorder,
                                }}
                              >
                                {mentor.hourly_wage_tier}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {mentor.subjects.map((s) => (
                                <span
                                  key={s}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-800"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>

                            <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                              <p>
                                <strong className="text-slate-800">가능 요일:</strong>{' '}
                                {mentor.available_days.join(', ')}
                              </p>
                              {mentor.wage_note && (
                                <p>
                                  <strong className="text-slate-800">조건 메모:</strong>{' '}
                                  {mentor.wage_note}
                                </p>
                              )}
                              <p className="flex items-start gap-1">
                                <MapPin
                                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                                  style={{ color: uni.accentColor }}
                                />
                                <span>
                                  {mentor.branches.length > 0
                                    ? mentor.branches.map((b) => b.name).join(', ')
                                    : '등록된 지점 없음'}
                                </span>
                              </p>
                            </div>

                            {mentor.bio && (
                              <p className="mt-3.5 line-clamp-2 rounded-2xl bg-slate-50/80 p-3.5 text-xs leading-relaxed text-slate-600">
                                {mentor.bio}
                              </p>
                            )}
                          </div>

                          <div className="mt-5 border-t border-slate-100 pt-4">
                            <button
                              type="button"
                              onClick={() => openRequestModal(mentor)}
                              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                            >
                              <Send className="h-3.5 w-3.5" />
                              멘토링 요청 보내기 (수락 시 연락처 공개)
                            </button>
                          </div>
                        </div>
                      </SpotlightCard>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 보낸 요청 관리 탭 */
          <div className="space-y-4">
            {sentRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                아직 보낸 멘토링 요청이 없습니다.
              </div>
            ) : (
              sentRequests.map((req) => {
                const uni = getUniversityTheme(req.mentor?.university ?? '');
                return (
                  <SpotlightCard
                    key={req.id}
                    glowColor={uni.glowColor}
                    className="bg-white/85 p-6 backdrop-blur-xl"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {uni.logo && (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white p-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={uni.logo}
                              alt={req.mentor?.university ?? ''}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-950">
                              {req.mentor?.name ?? '멘토'}
                            </span>
                            {req.mentor?.university && (
                              <span className="text-xs font-medium" style={{ color: uni.accentColor }}>
                                {req.mentor.university} · {req.mentor.major}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400">
                            요청일시: {new Date(req.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>

                      {req.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                          <Clock className="h-3.5 w-3.5" /> 멘토 응답 대기 중
                        </span>
                      )}
                      {req.status === 'accepted' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                          <CheckCircle2 className="h-3.5 w-3.5" /> 수락됨 · 연락처 공개
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          <XCircle className="h-3.5 w-3.5" /> 거절됨
                        </span>
                      )}
                    </div>

                    <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-700">
                      <p>
                        <strong>요청 과목:</strong> {req.subjects.join(', ') || '협의'} |{' '}
                        <strong>희망 요일:</strong> {req.preferred_days.join(', ') || '협의'} |{' '}
                        <strong>제시 급여:</strong> {req.proposed_wage || '지점 협의'}
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-slate-800">{req.message}</p>
                      {req.status === 'rejected' && req.reject_reason && (
                        <p className="mt-2 text-red-600">
                          <strong>거절 사유:</strong> {req.reject_reason}
                        </p>
                      )}
                    </div>

                    {req.status === 'accepted' && (
                      <div className="mt-3 flex flex-wrap items-center gap-4 rounded-2xl border border-teal-200/80 bg-teal-50/60 px-4 py-3 text-sm font-medium text-teal-950">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-teal-700" />
                          {req.mentor?.phone || '연락처 미등록'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-teal-700" />
                          {req.mentor?.email || ''}
                        </span>
                      </div>
                    )}
                  </SpotlightCard>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* 멘토링 요청 모달 */}
      {modalMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  {modalMentor.name} 멘토에게 요청 보내기
                </h2>
                <p className="text-xs text-slate-500">
                  {modalMentor.university} · {modalMentor.major}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMentor(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">요청 과목</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleFilter(reqSubjects, s, setReqSubjects)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        reqSubjects.includes(s)
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">희망 요일</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleFilter(reqDays, d, setReqDays)}
                      className={`h-8 w-8 rounded-full border text-xs font-medium transition ${
                        reqDays.includes(d)
                          ? 'border-teal-700 bg-teal-700 text-white'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  제시 급여 조건
                </label>
                <input
                  type="text"
                  value={reqWage}
                  onChange={(e) => setReqWage(e.target.value)}
                  placeholder="예: 시급 2.5만 원 / 지점 내규 협의"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    지점 담당자 성함 *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqContactName}
                    onChange={(e) => setReqContactName(e.target.value)}
                    placeholder="김담당"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    지점 담당자 연락처 *
                  </label>
                  <input
                    type="tel"
                    required
                    value={reqContactPhone}
                    onChange={(e) => setReqContactPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  멘토에게 전달할 메시지 *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reqMessage}
                  onChange={(e) => setReqMessage(e.target.value)}
                  placeholder="예: 매주 화/목 오후 5~8시 수학 질의응답 멘토링 가능하신지 문의드립니다."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
                />
              </div>

              {sendFeedback && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                  {sendFeedback}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMentor(null)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                  요청 발송 (이메일 자동 알림)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

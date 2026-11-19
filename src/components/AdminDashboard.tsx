'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Building2,
  Check,
  Clock,
  Copy,
  KeyRound,
  LogOut,
  MessageSquareText,
  Plus,
  Search,
  ShieldBan,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { REGIONS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { getUniversityTheme } from '@/lib/universities';
import type { Branch, InviteCode, MatchingRequest, MentorProfile, Profile } from '@/lib/types';
import { AntigravityCanvas } from './AntigravityCanvas';
import { SpotlightCard } from './SpotlightCard';

export interface AdminMentorRow extends Profile {
  mentor_profile: MentorProfile | null;
}

interface AdminDashboardProps {
  adminName: string;
  branches: Branch[];
  mentors: AdminMentorRow[];
  branchAccounts: Profile[];
  requests: MatchingRequest[];
  inviteCodes: InviteCode[];
}

const BURST_RAYS = [
  { angle: 0, len: 18, r: 42, color: '#2dd4bf' },
  { angle: 28, len: 24, r: 58, color: '#f97316' },
  { angle: 56, len: 14, r: 46, color: '#38bdf8' },
  { angle: 84, len: 22, r: 64, color: '#a3e635' },
  { angle: 112, len: 16, r: 48, color: '#2dd4bf' },
  { angle: 140, len: 26, r: 60, color: '#fb923c' },
  { angle: 168, len: 14, r: 44, color: '#38bdf8' },
  { angle: 196, len: 20, r: 56, color: '#a3e635' },
  { angle: 224, len: 16, r: 46, color: '#2dd4bf' },
  { angle: 252, len: 24, r: 62, color: '#f97316' },
  { angle: 280, len: 18, r: 48, color: '#38bdf8' },
  { angle: 308, len: 22, r: 58, color: '#a3e635' },
  { angle: 334, len: 14, r: 42, color: '#2dd4bf' },
];

export function AdminDashboard({
  adminName,
  branches,
  mentors,
  branchAccounts,
  requests,
  inviteCodes,
}: AdminDashboardProps) {
  const router = useRouter();
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setNowMs(Date.now()), 0);
    return () => clearTimeout(timer);
  }, []);
  const [tab, setTab] = useState<'overview' | 'mentors' | 'branches' | 'invites'>('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mentorSearch, setMentorSearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');

  const [newBranchRegion, setNewBranchRegion] = useState<string>(REGIONS[0]);
  const [newBranchName, setNewBranchName] = useState('');

  const [accBranchId, setAccBranchId] = useState(
    branches.find((b) => b.status === 'active')?.id ?? ''
  );
  const [accEmail, setAccEmail] = useState('');
  const [accName, setAccName] = useState('');
  const [accPassword, setAccPassword] = useState('');
  const [accMessage, setAccMessage] = useState<string | null>(null);

  const [newCode, setNewCode] = useState('');
  const [newCodeDesc, setNewCodeDesc] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('');

  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);
  const mentorMap = useMemo(() => new Map(mentors.map((m) => [m.id, m])), [mentors]);

  const pendingRequests = useMemo(
    () =>
      requests
        .filter((r) => r.status === 'pending')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [requests]
  );

  const branchStats = useMemo(() => {
    const map = new Map<
      string,
      { branch: Branch; total: number; accepted: number; pending: number; rejected: number }
    >();
    for (const req of requests) {
      const b = branchMap.get(req.branch_id);
      if (!b) continue;
      const entry = map.get(b.id) ?? {
        branch: b,
        total: 0,
        accepted: 0,
        pending: 0,
        rejected: 0,
      };
      entry.total += 1;
      if (req.status === 'accepted') entry.accepted += 1;
      else if (req.status === 'pending') entry.pending += 1;
      else entry.rejected += 1;
      map.set(b.id, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [requests, branchMap]);

  const filteredMentors = useMemo(() => {
    if (!mentorSearch.trim()) return mentors;
    const q = mentorSearch.trim().toLowerCase();
    return mentors.filter((m) => {
      const text = `${m.name} ${m.email} ${m.phone ?? ''} ${m.mentor_profile?.university ?? ''} ${m.mentor_profile?.major ?? ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [mentors, mentorSearch]);

  const filteredBranchesByRegion = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    return REGIONS.map((region) => {
      const list = branches.filter(
        (b) => b.region === region && (!q || b.name.toLowerCase().includes(q))
      );
      return { region, list };
    }).filter((group) => group.list.length > 0);
  }, [branches, branchSearch]);

  function copyText(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  }

  function formatElapsed(createdAt: string) {
    if (nowMs === null) return '계산 중';
    const hours = Math.floor((nowMs - new Date(createdAt).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return '1시간 미만';
    if (hours < 24) return `${hours}시간 경과`;
    return `${Math.floor(hours / 24)}일 ${hours % 24}시간 경과`;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace(`${window.location.origin}/login`);
  }

  async function toggleMentorActive(id: string, current: boolean) {
    await fetch(`/api/admin/mentors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    router.refresh();
  }

  async function handleAddBranch(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region: newBranchRegion, name: newBranchName }),
    });
    if (res.ok) {
      setNewBranchName('');
      router.refresh();
    }
  }

  async function toggleBranchStatus(id: string, current: 'active' | 'closed') {
    await fetch('/api/admin/branches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: current === 'active' ? 'closed' : 'active' }),
    });
    router.refresh();
  }

  async function handleCreateBranchAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccMessage(null);
    const res = await fetch('/api/admin/branch-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branch_id: accBranchId,
        email: accEmail,
        name: accName,
        password: accPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAccMessage(data.error || '생성에 실패했습니다.');
      return;
    }
    setAccEmail('');
    setAccName('');
    setAccPassword('');
    setAccMessage('지점 계정이 생성되었습니다.');
    router.refresh();
  }

  async function handleResetBranchPassword(userId: string) {
    const newPassword = window.prompt('새 비밀번호(6자 이상)를 입력하세요:');
    if (!newPassword || newPassword.length < 6) return;
    const res = await fetch('/api/admin/branch-accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, new_password: newPassword }),
    });
    if (res.ok) {
      alert('비밀번호가 변경되었습니다.');
    }
  }

  async function handleCreateInviteCode(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/invite-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: newCode,
        description: newCodeDesc,
        max_uses: newCodeMaxUses ? Number(newCodeMaxUses) : null,
      }),
    });
    if (res.ok) {
      setNewCode('');
      setNewCodeDesc('');
      setNewCodeMaxUses('');
      router.refresh();
    }
  }

  async function toggleInviteCode(id: string, current: boolean) {
    await fetch('/api/admin/invite-codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    });
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      {/* 상단 반투명 글래스 헤더 */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
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
            <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
              HQ ADMIN
            </span>
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">{adminName}</span>
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

      {/* 에디토리얼 히어로 섹션 (여기에만 마우스 반응형 파티클 적용) */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white py-14 sm:py-16">
        <AntigravityCanvas scoped />
        <div className="relative z-10 mx-auto max-w-[1360px] px-4 sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl sm:leading-[1.15]">
            전국 지점과 247멘토단 현황을
            <br />
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-lime-600 bg-clip-text text-transparent">
              한눈에 관리합니다
            </span>
          </h1>
        </div>
      </section>

      <main className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6">
        {/* Antigravity Use-Cases 스타일 다크 카드 탭 4개 */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 카드 1: 지점별 통계 · 미응답 (방사형 파티클 버스트 애니메이션) */}
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`group relative flex min-h-[215px] flex-col justify-between overflow-hidden rounded-3xl border bg-[#060B16] p-6 text-left transition duration-300 hover:-translate-y-1 ${
              tab === 'overview'
                ? 'border-teal-400/70 ring-2 ring-teal-400/30 shadow-xl shadow-slate-950/20'
                : 'border-slate-800/80 hover:border-slate-700 shadow-lg shadow-slate-950/10'
            }`}
          >
            {/* 배경 방사형 파티클 애니메이션 */}
            <svg
              aria-hidden="true"
              viewBox="0 0 240 200"
              className="pointer-events-none absolute -right-4 -top-4 h-48 w-56 opacity-75 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12"
            >
              <g transform="translate(135, 90)">
                {BURST_RAYS.map((ray, i) => (
                  <g key={i} transform={`rotate(${ray.angle})`}>
                    <line
                      x1={ray.r}
                      y1={0}
                      x2={ray.r + ray.len}
                      y2={0}
                      stroke={ray.color}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      className="transition-all duration-500"
                      opacity={tab === 'overview' ? 0.95 : 0.6}
                    />
                  </g>
                ))}
              </g>
              <circle
                cx="195"
                cy="45"
                r="26"
                fill="none"
                stroke="rgba(148,163,184,0.14)"
                strokeWidth="2"
              />
            </svg>

            <div className="relative z-10 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/10 text-sky-300">
                <BarChart3 className="h-5 w-5" />
              </span>
              {pendingRequests.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  미응답 {pendingRequests.length}건
                </span>
              )}
            </div>

            <div className="relative z-10 mt-8">
              <h2 className="text-base font-bold tracking-tight text-white">
                지점별 통계 · 미응답
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                지점별 요청·매칭률과 미응답 멘토 알림톡 발송 대상을 즉시 확인합니다.
              </p>
            </div>
          </button>

          {/* 카드 2: 멘토 관리 (노드 그리드 & 연결선 애니메이션) */}
          <button
            type="button"
            onClick={() => setTab('mentors')}
            className={`group relative flex min-h-[215px] flex-col justify-between overflow-hidden rounded-3xl border bg-[#060B16] p-6 text-left transition duration-300 hover:-translate-y-1 ${
              tab === 'mentors'
                ? 'border-teal-400/70 ring-2 ring-teal-400/30 shadow-xl shadow-slate-950/20'
                : 'border-slate-800/80 hover:border-slate-700 shadow-lg shadow-slate-950/10'
            }`}
          >
            {/* 배경 그리드 & 연결 노드 애니메이션 */}
            <svg
              aria-hidden="true"
              viewBox="0 0 240 180"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-75 transition-transform duration-700 group-hover:scale-105"
            >
              <defs>
                <pattern id="adminGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path
                    d="M 24 0 L 0 0 0 24"
                    fill="none"
                    stroke="rgba(148,163,184,0.08)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="240" height="180" fill="url(#adminGrid)" />
              <line
                x1="96"
                y1="24"
                x2="168"
                y2="24"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.65"
                className="transition-all duration-500 group-hover:opacity-100"
              />
              <line
                x1="120"
                y1="48"
                x2="120"
                y2="120"
                stroke="#f97316"
                strokeWidth="1.5"
                opacity="0.65"
              />
              <line
                x1="168"
                y1="48"
                x2="168"
                y2="112"
                stroke="#eab308"
                strokeWidth="1.5"
                opacity="0.65"
              />
              <circle cx="120" cy="48" r="3" fill="#f97316" />
              <circle cx="168" cy="48" r="3" fill="#38bdf8" />
              <circle cx="168" cy="112" r="3" fill="#2dd4bf" />
              <circle cx="120" cy="120" r="3" fill="#a3e635" />
            </svg>

            <div className="relative z-10 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300">
                <Users className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                {mentors.length}명
              </span>
            </div>

            <div className="relative z-10 mt-8">
              <h2 className="text-base font-bold tracking-tight text-white">멘토 관리</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                전체 멘토 스펙·연락처를 검색하고 계정을 강제 비활성화하거나 재활성화합니다.
              </p>
            </div>
          </button>

          {/* 카드 3: 지점 · 계정 관리 (동심원 레이더 파동 애니메이션) */}
          <button
            type="button"
            onClick={() => setTab('branches')}
            className={`group relative flex min-h-[215px] flex-col justify-between overflow-hidden rounded-3xl border bg-[#060B16] p-6 text-left transition duration-300 hover:-translate-y-1 ${
              tab === 'branches'
                ? 'border-teal-400/70 ring-2 ring-teal-400/30 shadow-xl shadow-slate-950/20'
                : 'border-slate-800/80 hover:border-slate-700 shadow-lg shadow-slate-950/10'
            }`}
          >
            {/* 배경 동심원 파동 애니메이션 */}
            <svg
              aria-hidden="true"
              viewBox="0 0 240 180"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-80 transition-transform duration-700 group-hover:scale-110"
            >
              <g transform="translate(128, 72)">
                <circle r="18" fill="none" stroke="rgba(56,189,248,0.28)" strokeWidth="1" />
                <circle r="36" fill="none" stroke="rgba(56,189,248,0.20)" strokeWidth="1" />
                <circle r="54" fill="none" stroke="rgba(56,189,248,0.14)" strokeWidth="1" />
                <circle r="72" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="1" />
                <circle cx="0" cy="0" r="3.5" fill="#7dd3fc" className="animate-pulse" />
              </g>
            </svg>

            <div className="relative z-10 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-500/10 text-teal-300">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                {branches.filter((b) => b.status === 'active').length}개 운영
              </span>
            </div>

            <div className="relative z-10 mt-8">
              <h2 className="text-base font-bold tracking-tight text-white">지점 · 계정 관리</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                전국 지점 신규 개원·해지 상태를 관리하고 지점 계정과 비밀번호를 발급합니다.
              </p>
            </div>
          </button>

          {/* 카드 4: 초대 코드 관리 (궤도 링 애니메이션) */}
          <button
            type="button"
            onClick={() => setTab('invites')}
            className={`group relative flex min-h-[215px] flex-col justify-between overflow-hidden rounded-3xl border bg-[#060B16] p-6 text-left transition duration-300 hover:-translate-y-1 ${
              tab === 'invites'
                ? 'border-teal-400/70 ring-2 ring-teal-400/30 shadow-xl shadow-slate-950/20'
                : 'border-slate-800/80 hover:border-slate-700 shadow-lg shadow-slate-950/10'
            }`}
          >
            {/* 배경 궤도 애니메이션 */}
            <svg
              aria-hidden="true"
              viewBox="0 0 240 180"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-75 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-105"
            >
              <g transform="translate(145, 75)">
                <ellipse
                  rx="62"
                  ry="26"
                  transform="rotate(-22)"
                  fill="none"
                  stroke="rgba(163,230,53,0.22)"
                  strokeWidth="1.2"
                  strokeDasharray="6 6"
                />
                <ellipse
                  rx="44"
                  ry="44"
                  fill="none"
                  stroke="rgba(45,212,191,0.18)"
                  strokeWidth="1.2"
                />
                <circle cx="38" cy="-22" r="3" fill="#a3e635" />
                <circle cx="-42" cy="14" r="2.5" fill="#2dd4bf" />
              </g>
            </svg>

            <div className="relative z-10 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime-400/25 bg-lime-500/10 text-lime-300">
                <KeyRound className="h-5 w-5" />
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                활성 {inviteCodes.filter((ic) => ic.is_active).length}개
              </span>
            </div>

            <div className="relative z-10 mt-8">
              <h2 className="text-base font-bold tracking-tight text-white">초대 코드 관리</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                247멘토단 회원가입용 초대 코드와 전용 가입 링크를 생성·만료 처리합니다.
              </p>
            </div>
          </button>
        </div>

        {/* 탭 1: 미응답 관리 & 지점별 통계 */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <SpotlightCard
              className="bg-white/80 p-6 backdrop-blur-xl sm:p-7"
              glowColor="rgba(15, 118, 110, 0.14)"
            >
              <div className="mb-5">
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  미응답 멘토 리스트 (수동 알림톡 발송용)
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  오래 대기 중인 요청부터 표시됩니다. 연락처 또는 알림톡 안내 문구를 1클릭으로 복사하세요.
                </p>
              </div>

              {pendingRequests.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  현재 미응답 대기 중인 요청이 없습니다.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200/80 text-xs text-slate-500">
                      <tr>
                        <th className="py-3 pr-4">대기 시간</th>
                        <th className="py-3 pr-4">요청 지점</th>
                        <th className="py-3 pr-4">멘토명</th>
                        <th className="py-3 pr-4">요청 과목</th>
                        <th className="py-3 text-right">연락처 · 알림톡 복사</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingRequests.map((req) => {
                        const branch = branchMap.get(req.branch_id);
                        const mentor = mentorMap.get(req.mentor_id);
                        const alimtalkMsg = `[247멘토단] ${mentor?.name ?? ''} 멘토님, ${branch?.name ?? '지점'} 지점에서 멘토링 요청(${req.subjects.join(', ') || '협의'})이 도착했습니다. 웹사이트에서 확인 후 수락/거절 부탁드립니다.`;
                        return (
                          <tr key={req.id}>
                            <td className="py-3.5 pr-4">
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                <Clock className="h-3 w-3" />
                                {formatElapsed(req.created_at)}
                              </span>
                            </td>
                            <td className="py-3.5 pr-4 font-medium text-slate-950">
                              {branch ? `${branch.region} · ${branch.name}` : '-'}
                            </td>
                            <td className="py-3.5 pr-4">
                              <div className="font-medium text-slate-950">
                                {mentor?.name ?? '-'}
                              </div>
                              <div className="text-xs text-slate-400">{mentor?.email}</div>
                            </td>
                            <td className="py-3.5 pr-4 text-xs text-slate-600">
                              {req.subjects.join(', ') || '협의'}
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="inline-flex flex-wrap justify-end gap-1.5">
                                {mentor?.phone && (
                                  <button
                                    type="button"
                                    onClick={() => copyText(`phone-${req.id}`, mentor.phone!)}
                                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    {copiedId === `phone-${req.id}` ? (
                                      <>
                                        <Check className="h-3.5 w-3.5 text-teal-700" />
                                        복사됨
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                                        {mentor.phone}
                                      </>
                                    )}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => copyText(`msg-${req.id}`, alimtalkMsg)}
                                  className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
                                >
                                  {copiedId === `msg-${req.id}` ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-teal-300" />
                                      문구 복사됨
                                    </>
                                  ) : (
                                    <>
                                      <MessageSquareText className="h-3.5 w-3.5" />
                                      알림톡 문구 복사
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SpotlightCard>

            <SpotlightCard
              className="bg-white/80 p-6 backdrop-blur-xl sm:p-7"
              glowColor="rgba(15, 118, 110, 0.14)"
            >
              <h2 className="mb-5 text-lg font-bold tracking-tight text-slate-950">
                지점별 요청 / 매칭 건수
              </h2>
              {branchStats.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  아직 요청 이력이 없습니다.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200/80 text-xs text-slate-500">
                      <tr>
                        <th className="py-3 pr-4">권역</th>
                        <th className="py-3 pr-4">지점명</th>
                        <th className="py-3 pr-4">총 요청</th>
                        <th className="py-3 pr-4">매칭 수락</th>
                        <th className="py-3 pr-4">대기</th>
                        <th className="py-3 pr-4">거절</th>
                        <th className="py-3">매칭률</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {branchStats.map((row) => {
                        const rate =
                          row.total > 0 ? Math.round((row.accepted / row.total) * 100) : 0;
                        return (
                          <tr key={row.branch.id}>
                            <td className="py-3.5 pr-4 text-xs text-slate-500">
                              {row.branch.region}
                            </td>
                            <td className="py-3.5 pr-4 font-semibold text-slate-950">
                              {row.branch.name}
                            </td>
                            <td className="py-3.5 pr-4">{row.total}건</td>
                            <td className="py-3.5 pr-4 font-semibold text-teal-700">
                              {row.accepted}건
                            </td>
                            <td className="py-3.5 pr-4 text-amber-700">{row.pending}건</td>
                            <td className="py-3.5 pr-4 text-slate-400">{row.rejected}건</td>
                            <td className="py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-teal-600"
                                    style={{ width: `${rate}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-700">
                                  {rate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SpotlightCard>
          </div>
        )}

        {/* 탭 2: 멘토 관리 */}
        {tab === 'mentors' && (
          <SpotlightCard
            className="bg-white/80 p-6 backdrop-blur-xl sm:p-7"
            glowColor="rgba(15, 118, 110, 0.14)"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight text-slate-950">
                전체 멘토 목록 ({filteredMentors.length}명)
              </h2>
              <input
                type="text"
                value={mentorSearch}
                onChange={(e) => setMentorSearch(e.target.value)}
                placeholder="이름, 이메일, 연락처, 대학 검색"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-teal-600 sm:w-72"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 text-xs text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">이름 / 이메일</th>
                    <th className="py-3 pr-4">연락처</th>
                    <th className="py-3 pr-4">대학 / 전공</th>
                    <th className="py-3 pr-4">과목</th>
                    <th className="py-3 pr-4">계정 상태</th>
                    <th className="py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMentors.map((m) => {
                    const uni = getUniversityTheme(m.mentor_profile?.university ?? '');
                    return (
                      <tr key={m.id} className={!m.is_active ? 'bg-slate-50/70 opacity-70' : ''}>
                        <td className="py-3.5 pr-4">
                          <div className="font-semibold text-slate-950">{m.name}</div>
                          <div className="text-xs text-slate-400">{m.email}</div>
                        </td>
                        <td className="py-3.5 pr-4 text-xs text-slate-700">{m.phone ?? '-'}</td>
                        <td className="py-3.5 pr-4 text-xs text-slate-700">
                          {m.mentor_profile ? (
                            <div className="flex items-center gap-2.5">
                              {uni.logo && (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white p-1 shadow-2xs">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={uni.logo}
                                    alt={m.mentor_profile.university}
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                              )}
                              <div>
                                <span
                                  className="font-semibold"
                                  style={{ color: uni.accentColor }}
                                >
                                  {m.mentor_profile.university}
                                </span>
                                <span className="text-slate-500"> · {m.mentor_profile.major}</span>
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3.5 pr-4 text-xs text-slate-600">
                          {m.mentor_profile?.subjects.join(', ') ?? '-'}
                        </td>
                        <td className="py-3.5 pr-4">
                          {m.is_active ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                              <ShieldCheck className="h-3 w-3" /> 활성
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                              <ShieldBan className="h-3 w-3" /> 강제 비활성화
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => toggleMentorActive(m.id, m.is_active)}
                            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                              m.is_active
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-teal-200 text-teal-700 hover:bg-teal-50'
                            }`}
                          >
                            {m.is_active ? '강제 비활성화' : '재활성화'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SpotlightCard>
        )}

        {/* 탭 3: 지점 및 계정 관리 */}
        {tab === 'branches' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <SpotlightCard
                className="bg-white/80 p-6 backdrop-blur-xl sm:p-7"
                glowColor="rgba(15, 118, 110, 0.14)"
              >
                <form onSubmit={handleAddBranch} className="space-y-4">
                  <h2 className="text-lg font-bold tracking-tight text-slate-950">신규 지점 추가</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={newBranchRegion}
                      onChange={(e) => setNewBranchRegion(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="지점명 (예: 위례)"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" /> 지점 추가
                  </button>
                </form>
              </SpotlightCard>

              <SpotlightCard
                className="bg-white/80 p-6 backdrop-blur-xl sm:p-7"
                glowColor="rgba(15, 118, 110, 0.14)"
              >
                <form onSubmit={handleCreateBranchAccount} className="space-y-4">
                  <h2 className="text-lg font-bold tracking-tight text-slate-950">지점 계정 발급</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={accBranchId}
                      onChange={(e) => setAccBranchId(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                    >
                      {branches
                        .filter((b) => b.status === 'active')
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            [{b.region}] {b.name}
                          </option>
                        ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={accName}
                      onChange={(e) => setAccName(e.target.value)}
                      placeholder="담당자/지점 표시명"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                    />
                    <input
                      type="email"
                      required
                      value={accEmail}
                      onChange={(e) => setAccEmail(e.target.value)}
                      placeholder="로그인 이메일"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                    />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={accPassword}
                      onChange={(e) => setAccPassword(e.target.value)}
                      placeholder="초기 비밀번호 (6자 이상)"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                    />
                  </div>
                  {accMessage && <p className="text-xs font-medium text-teal-700">{accMessage}</p>}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" /> 지점 계정 생성
                  </button>
                </form>
              </SpotlightCard>
            </div>

            <SpotlightCard
              className="bg-white/80 p-6 backdrop-blur-xl sm:p-7"
              glowColor="rgba(15, 118, 110, 0.14)"
            >
              <h2 className="mb-5 text-lg font-bold tracking-tight text-slate-950">
                발급된 지점 계정 ({branchAccounts.length}개)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200/80 text-xs text-slate-500">
                    <tr>
                      <th className="py-2.5 pr-4">지점</th>
                      <th className="py-2.5 pr-4">표시명</th>
                      <th className="py-2.5 pr-4">로그인 이메일</th>
                      <th className="py-2.5 text-right">비밀번호 관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {branchAccounts.map((acc) => {
                      const b = acc.branch_id ? branchMap.get(acc.branch_id) : null;
                      return (
                        <tr key={acc.id}>
                          <td className="py-3 pr-4 font-medium text-slate-950">
                            {b ? `${b.region} · ${b.name}` : '-'}
                          </td>
                          <td className="py-3 pr-4">{acc.name}</td>
                          <td className="py-3 pr-4 text-xs text-slate-600">{acc.email}</td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleResetBranchPassword(acc.id)}
                              className="rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              비밀번호 초기화
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SpotlightCard>

            {/* 7개 권역별 지점 마스터 + 검색 */}
            <SpotlightCard
              className="bg-white/80 p-6 backdrop-blur-xl sm:p-7"
              glowColor="rgba(15, 118, 110, 0.14)"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  전국 지점 마스터 ({branches.length}개)
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    placeholder="지점명 검색..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredBranchesByRegion.map(({ region, list }) => {
                  const activeLen = list.filter((b) => b.status === 'active').length;
                  return (
                    <div
                      key={region}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{region}</span>
                        <span className="text-xs text-slate-500">
                          운영 {activeLen} / 전체 {list.length}
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {list.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => toggleBranchStatus(b.id, b.status)}
                            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                              b.status === 'active'
                                ? 'border-slate-200/80 bg-white hover:border-teal-300 hover:bg-teal-50/30'
                                : 'border-slate-200/60 bg-slate-100/70 hover:border-slate-300 hover:bg-white'
                            }`}
                          >
                            <span
                              className={`font-semibold ${
                                b.status === 'closed'
                                  ? 'text-slate-400 line-through'
                                  : 'text-slate-900'
                              }`}
                            >
                              {b.name}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 font-medium ${
                                b.status === 'active'
                                  ? 'bg-teal-50 text-teal-800'
                                  : 'bg-slate-200/80 text-slate-500'
                              }`}
                            >
                              {b.status === 'active' ? '운영' : '비운영'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SpotlightCard>
          </div>
        )}

        {/* 탭 4: 초대 코드 관리 */}
        {tab === 'invites' && (
          <div className="space-y-6">
            <SpotlightCard
              className="bg-white/80 p-6 backdrop-blur-xl sm:p-7"
              glowColor="rgba(15, 118, 110, 0.14)"
            >
              <form onSubmit={handleCreateInviteCode} className="space-y-4">
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  새 멘토 초대 코드 생성
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="코드 (예: 247MENTOR_NOV)"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                  />
                  <input
                    type="text"
                    value={newCodeDesc}
                    onChange={(e) => setNewCodeDesc(e.target.value)}
                    placeholder="설명 (예: 11월 신규 모집용)"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                  />
                  <input
                    type="number"
                    min={1}
                    value={newCodeMaxUses}
                    onChange={(e) => setNewCodeMaxUses(e.target.value)}
                    placeholder="최대 사용 횟수 (비우면 무제한)"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" /> 초대 코드 생성
                </button>
              </form>
            </SpotlightCard>

            <SpotlightCard
              className="bg-white/80 p-6 backdrop-blur-xl sm:p-7"
              glowColor="rgba(15, 118, 110, 0.14)"
            >
              <h2 className="mb-5 text-lg font-bold tracking-tight text-slate-950">
                초대 코드 목록
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200/80 text-xs text-slate-500">
                    <tr>
                      <th className="py-2.5 pr-4">코드</th>
                      <th className="py-2.5 pr-4">설명</th>
                      <th className="py-2.5 pr-4">사용 횟수</th>
                      <th className="py-2.5 pr-4">초대 링크 복사</th>
                      <th className="py-2.5 text-right">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inviteCodes.map((ic) => (
                      <tr key={ic.id}>
                        <td className="py-3.5 pr-4 font-mono font-semibold text-slate-950">
                          {ic.code}
                        </td>
                        <td className="py-3.5 pr-4 text-xs text-slate-600">
                          {ic.description ?? '-'}
                        </td>
                        <td className="py-3.5 pr-4 text-xs">
                          {ic.used_count} / {ic.max_uses ?? '무제한'}
                        </td>
                        <td className="py-3.5 pr-4">
                          <button
                            type="button"
                            onClick={() =>
                              copyText(ic.id, `${window.location.origin}/signup?code=${ic.code}`)
                            }
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            {copiedId === ic.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-teal-700" /> 복사됨
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-slate-400" /> 가입 링크 복사
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => toggleInviteCode(ic.id, ic.is_active)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              ic.is_active
                                ? 'bg-teal-50 text-teal-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {ic.is_active ? '활성' : '비활성'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SpotlightCard>
          </div>
        )}
      </main>
    </div>
  );
}

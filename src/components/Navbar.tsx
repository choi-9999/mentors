'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/types';

interface NavbarProps {
  name: string;
  role: UserRole;
  branchName?: string | null;
}

const ROLE_LABEL: Record<UserRole, string> = {
  mentor: '247멘토단',
  branch: '지점 담당자',
  admin: '본사 관리자',
};

const ROLE_COLOR: Record<UserRole, string> = {
  mentor: 'bg-teal-50 text-teal-800 border-teal-200/80',
  branch: 'bg-lime-50 text-lime-800 border-lime-200/80',
  admin: 'bg-slate-900 text-white border-slate-900',
};

export function Navbar({ name, role, branchName }: NavbarProps) {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace(`${window.location.origin}/login`);
  }

  const homeHref = role === 'admin' ? '/admin' : role === 'branch' ? '/branch' : '/mentor';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href={homeHref} className="flex items-center gap-3">
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
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${ROLE_COLOR[role]}`}
          >
            {ROLE_LABEL[role]}
            {branchName ? ` · ${branchName}` : ''}
          </span>
          <span className="hidden text-sm font-medium text-slate-700 sm:inline">{name}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-3.5 w-3.5" />
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}

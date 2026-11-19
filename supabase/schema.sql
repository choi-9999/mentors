-- 247멘토단 × 전국 지점 연계 플랫폼 DB 스키마
-- Supabase SQL Editor에서 순서대로 실행하세요.

create extension if not exists "pgcrypto";

-- 1. 전국 지점 마스터 테이블
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  region text not null check (region in ('서울', '경기/인천', '강원', '대전/충청', '광주/전라', '부산/울산/대구/경상', '제주')),
  name text not null unique,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now()
);

-- 2. 사용자 기본 프로필 (이메일/연락처 등 민감정보 포함)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('mentor', 'branch', 'admin')),
  email text not null,
  name text not null,
  phone text,
  branch_id uuid references public.branches(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. 멘토 상세 스펙 테이블 (민감 연락처 제외 — 필터 검색용)
create table if not exists public.mentor_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  gender text not null check (gender in ('남성', '여성')),
  university text not null,
  major text not null,
  enrollment_status text not null check (enrollment_status in ('재학', '휴학', '졸업')),
  subjects text[] not null default '{}',
  available_days text[] not null default '{}',
  hourly_wage_tier text not null check (hourly_wage_tier in ('2만 원 미만', '2~3만 원', '3~4만 원', '4만 원 이상', '협의 가능')),
  wage_note text,
  bio text,
  is_remote_available boolean not null default false,
  is_recruiting boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 4. 멘토 ↔ 활동 가능 지점 다대다 연결
create table if not exists public.mentor_branches (
  mentor_id uuid not null references public.mentor_profiles(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  primary key (mentor_id, branch_id)
);

-- 5. 지점 → 멘토 멘토링 요청 테이블
create table if not exists public.matching_requests (
  id uuid primary key default gen_random_uuid(),
  branch_user_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  mentor_id uuid not null references public.mentor_profiles(id) on delete cascade,
  subjects text[] not null default '{}',
  preferred_days text[] not null default '{}',
  proposed_wage text,
  message text not null,
  branch_contact_name text not null,
  branch_contact_phone text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  reject_reason text,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

-- 6. 멘토 가입용 초대 코드
create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  is_active boolean not null default true,
  max_uses int,
  used_count int not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- 인덱스
create index if not exists idx_branches_region_status on public.branches(region, status);
create index if not exists idx_mentor_profiles_recruiting on public.mentor_profiles(is_recruiting);
create index if not exists idx_mentor_branches_branch_id on public.mentor_branches(branch_id);
create index if not exists idx_matching_requests_mentor_status on public.matching_requests(mentor_id, status);
create index if not exists idx_matching_requests_branch_status on public.matching_requests(branch_id, status);

-- ============================================================
-- Row Level Security (RLS) 설정
-- ============================================================
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.mentor_profiles enable row level security;
alter table public.mentor_branches enable row level security;
alter table public.matching_requests enable row level security;
alter table public.invite_codes enable row level security;

-- 헬퍼 함수: 현재 사용자 역할 조회
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- branches: 인증된 모든 사용자(및 회원가입 시 비로그인 포함) 조회 가능, 수정은 admin만
create policy "branches_select_all" on public.branches
  for select using (true);

create policy "branches_admin_all" on public.branches
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- profiles: 본인, admin, 또는 수락된 매칭이 있는 지점만 해당 멘토 연락처/프로필 조회 가능
create policy "profiles_select_policy" on public.profiles
  for select using (
    id = auth.uid()
    or public.current_user_role() = 'admin'
    or (
      public.current_user_role() = 'branch'
      and role = 'mentor'
      and exists (
        select 1 from public.matching_requests mr
        where mr.mentor_id = profiles.id
          and mr.branch_user_id = auth.uid()
          and mr.status = 'accepted'
      )
    )
  );

create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.current_user_role() = 'admin')
  with check (id = auth.uid() or public.current_user_role() = 'admin');

-- mentor_profiles: 지점/멘토/관리자 조회 가능 (단, 활성 계정만 지점에 노출)
create policy "mentor_profiles_select" on public.mentor_profiles
  for select using (
    id = auth.uid()
    or public.current_user_role() = 'admin'
    or (
      public.current_user_role() = 'branch'
      and exists (
        select 1 from public.profiles p
        where p.id = mentor_profiles.id and p.is_active = true
      )
    )
  );

create policy "mentor_profiles_insert_own" on public.mentor_profiles
  for insert with check (id = auth.uid());

create policy "mentor_profiles_update_own_or_admin" on public.mentor_profiles
  for update using (id = auth.uid() or public.current_user_role() = 'admin')
  with check (id = auth.uid() or public.current_user_role() = 'admin');

-- mentor_branches: 인증 사용자 조회, 본인만 수정
create policy "mentor_branches_select" on public.mentor_branches
  for select using (auth.uid() is not null);

create policy "mentor_branches_manage_own" on public.mentor_branches
  for all using (mentor_id = auth.uid() or public.current_user_role() = 'admin')
  with check (mentor_id = auth.uid() or public.current_user_role() = 'admin');

-- matching_requests: 보낸 지점, 받은 멘토, 관리자 조회
create policy "matching_requests_select" on public.matching_requests
  for select using (
    branch_user_id = auth.uid()
    or mentor_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

create policy "matching_requests_insert_branch" on public.matching_requests
  for insert with check (
    branch_user_id = auth.uid()
    and public.current_user_role() = 'branch'
  );

create policy "matching_requests_update_mentor_or_admin" on public.matching_requests
  for update using (
    mentor_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

-- invite_codes: admin만 관리 (회원가입 시 검증은 서버 API에서 service_role로 처리)
create policy "invite_codes_admin_only" on public.invite_codes
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- 멘토 목록 조회용 안전 뷰 (지점 검색 시 이름/스펙은 보이되 전화번호/이메일은 제외)
create or replace view public.mentor_directory as
select
  mp.id,
  p.name,
  p.is_active,
  mp.gender,
  mp.university,
  mp.major,
  mp.enrollment_status,
  mp.subjects,
  mp.available_days,
  mp.hourly_wage_tier,
  mp.wage_note,
  mp.bio,
  mp.is_remote_available,
  mp.is_recruiting,
  mp.updated_at
from public.mentor_profiles mp
join public.profiles p on p.id = mp.id
where p.role = 'mentor';

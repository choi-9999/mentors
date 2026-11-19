import type { DayOfWeek, EnrollmentStatus, Gender, Region, Subject, WageTier } from './constants';

export type UserRole = 'mentor' | 'branch' | 'admin';
export type BranchStatus = 'active' | 'closed';
export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface Branch {
  id: string;
  region: Region;
  name: string;
  status: BranchStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  phone: string | null;
  branch_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MentorProfile {
  id: string;
  gender: Gender;
  university: string;
  major: string;
  enrollment_status: EnrollmentStatus;
  subjects: Subject[];
  available_days: DayOfWeek[];
  hourly_wage_tier: WageTier;
  wage_note: string | null;
  bio: string | null;
  is_remote_available: boolean;
  is_recruiting: boolean;
  updated_at: string;
}

export interface MentorDirectoryItem extends MentorProfile {
  name: string;
  is_active: boolean;
  branch_ids: string[];
  branches: Pick<Branch, 'id' | 'region' | 'name'>[];
}

export interface MatchingRequest {
  id: string;
  branch_user_id: string;
  branch_id: string;
  mentor_id: string;
  subjects: Subject[];
  preferred_days: DayOfWeek[];
  proposed_wage: string | null;
  message: string;
  branch_contact_name: string;
  branch_contact_phone: string;
  status: RequestStatus;
  reject_reason: string | null;
  responded_at: string | null;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  description: string | null;
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
}

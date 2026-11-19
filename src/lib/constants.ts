export const REGIONS = [
  '서울',
  '경기/인천',
  '강원',
  '대전/충청',
  '광주/전라',
  '부산/울산/대구/경상',
  '제주',
] as const;

export type Region = (typeof REGIONS)[number];

export const SUBJECTS = [
  '국어',
  '수학',
  '영어',
  '통합사회',
  '통합과학',
  '논술',
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

export type DayOfWeek = (typeof DAYS)[number];

export const WAGE_TIERS = [
  '2만 원 미만',
  '2~3만 원',
  '3~4만 원',
  '4만 원 이상',
  '협의 가능',
] as const;

export type WageTier = (typeof WAGE_TIERS)[number];

export const ENROLLMENT_STATUSES = ['재학', '휴학', '졸업'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const GENDERS = ['남성', '여성'] as const;
export type Gender = (typeof GENDERS)[number];

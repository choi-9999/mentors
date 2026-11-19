export interface UniversityTheme {
  logo: string | null;
  accentColor: string;
  glowColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

const DEFAULT_THEME: UniversityTheme = {
  logo: null,
  accentColor: '#0F766E',
  glowColor: 'rgba(15, 118, 110, 0.14)',
  badgeBg: 'rgba(240, 253, 250, 0.95)',
  badgeText: '#115E59',
  badgeBorder: 'rgba(153, 246, 228, 0.9)',
};

export function getUniversityTheme(university: string): UniversityTheme {
  const normalized = university.trim().toLowerCase();

  if (normalized.includes('서울대') || normalized.includes('snu')) {
    return {
      logo: '/images/universities/snu.webp',
      accentColor: '#0F0F70',
      glowColor: 'rgba(15, 15, 112, 0.16)',
      badgeBg: 'rgba(238, 242, 255, 0.95)',
      badgeText: '#1E1B4B',
      badgeBorder: 'rgba(199, 210, 254, 0.9)',
    };
  }

  if (normalized.includes('연세대') || normalized.includes('yonsei')) {
    return {
      logo: '/images/universities/yonsei.webp',
      accentColor: '#003876',
      glowColor: 'rgba(0, 56, 118, 0.16)',
      badgeBg: 'rgba(239, 246, 255, 0.95)',
      badgeText: '#1E3A8A',
      badgeBorder: 'rgba(191, 219, 254, 0.9)',
    };
  }

  if (normalized.includes('고려대') || normalized.includes('korea')) {
    return {
      logo: '/images/universities/korea.webp',
      accentColor: '#8B0029',
      glowColor: 'rgba(139, 0, 41, 0.16)',
      badgeBg: 'rgba(255, 241, 242, 0.95)',
      badgeText: '#881337',
      badgeBorder: 'rgba(254, 205, 211, 0.9)',
    };
  }

  if (normalized.includes('한양대') || normalized.includes('hanyang')) {
    return {
      logo: '/images/universities/hanyang.png',
      accentColor: '#0E4A84',
      glowColor: 'rgba(14, 74, 132, 0.16)',
      badgeBg: 'rgba(239, 246, 255, 0.95)',
      badgeText: '#1E3A8A',
      badgeBorder: 'rgba(191, 219, 254, 0.9)',
    };
  }

  if (normalized.includes('부산대') || normalized.includes('pusan')) {
    return {
      logo: '/images/universities/pusan.webp',
      accentColor: '#005BAA',
      glowColor: 'rgba(0, 91, 170, 0.16)',
      badgeBg: 'rgba(240, 249, 255, 0.95)',
      badgeText: '#075985',
      badgeBorder: 'rgba(186, 230, 253, 0.9)',
    };
  }

  if (normalized.includes('성균관') || normalized.includes('skku')) {
    return {
      logo: '/images/universities/skku.png',
      accentColor: '#006B3F',
      glowColor: 'rgba(0, 107, 63, 0.16)',
      badgeBg: 'rgba(236, 253, 245, 0.95)',
      badgeText: '#065F46',
      badgeBorder: 'rgba(167, 243, 208, 0.9)',
    };
  }

  return DEFAULT_THEME;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Filter,
  Globe,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { AntigravityCanvas } from './AntigravityCanvas';
import { SpotlightCard } from './SpotlightCard';

function CountUpNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const totalFrames = 36;
    const timer = setInterval(() => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      setValue(Math.round(target * progress));
      if (frame >= totalFrames) clearInterval(timer);
    }, 24);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

const STORY_STEPS = [
  {
    step: '01',
    title: '멘토 스펙 & 전국 지점 등록',
    desc: '초대 코드로 검증된 247멘토단이 대학·학과, 가능 과목(국/수/영/통사/통과/논술), 가능 요일, 희망 시급 구간과 활동 가능한 전국 지점을 한 번에 등록합니다.',
  },
  {
    step: '02',
    title: '지점별 맞춤형 조건 필터링',
    desc: '전국 지점 담당자는 로그인 즉시 본인 지점 기준으로 필터링된 멘토를 확인하고, 과목·성별·요일·시급 구간을 조합해 원하는 멘토를 빠르게 찾습니다.',
  },
  {
    step: '03',
    title: '요청 발송 & 수락 시 연락처 공개',
    desc: '지점이 멘토링 요청을 보내면 멘토에게 자동 이메일이 발송됩니다. 멘토가 요청을 수락하는 순간에만 양측의 연락처가 안전하게 공개됩니다.',
  },
];

const REGION_HIGHLIGHTS = [
  { region: '서울', sample: '대치 · 목동 · 마포 · 송파 외 13개 지점' },
  { region: '경기/인천', sample: '분당정자 · 위례 · 동탄 · 송도 외 20개 지점' },
  { region: '부산/울산/대구/경상', sample: '부산서면 · 부산남천 · 대구수성 외 12개 지점' },
  { region: '광주/전라 · 대전/충청 · 강원 · 제주', sample: '광주동구 2관 · 대전둔산 · 원주 · 제주 외 12개 지점' },
];

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 40);
  });

  // Hero 스크롤 패럴랙스
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, -70]);
  const heroOpacity = useTransform(heroProgress, [0, 0.85], [1, 0]);

  // 소개 영상 섹션 스크롤 확장 효과
  const videoSectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: videoProgress } = useScroll({
    target: videoSectionRef,
    offset: ['start end', 'center center'],
  });
  const videoScale = useTransform(videoProgress, [0, 1], [0.88, 1]);
  const videoRadius = useTransform(videoProgress, [0, 1], [36, 24]);

  // Sticky 3단계 스토리텔링 스크롤 연동
  const storyRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: storyProgress } = useScroll({
    target: storyRef,
    offset: ['start center', 'end center'],
  });
  useMotionValueEvent(storyProgress, 'change', (latest) => {
    if (latest < 0.34) setActiveStep(0);
    else if (latest < 0.68) setActiveStep(1);
    else setActiveStep(2);
  });

  return (
    <div className="relative bg-white text-slate-950">
      <AntigravityCanvas />

      {/* 스크롤 반응형 글래스 상단 헤더 */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'border-b border-slate-200/80 bg-white/80 py-3 backdrop-blur-xl'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/etoos247-bi.png"
              alt="이투스247학원"
              className="h-7 w-auto object-contain"
            />
            <span className="hidden h-4 w-px bg-slate-300 sm:inline-block" />
            <span className="hidden text-xs font-semibold tracking-tight text-slate-600 sm:inline">
              247MENTORS
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/signup"
              className="rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              멘토 회원가입
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-slate-950 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              로그인
            </Link>
          </div>
        </div>
      </header>

      {/* Section 1: 히어로 */}
      <section
        ref={heroRef}
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-16"
      >
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="w-full max-w-6xl text-center"
        >
          <div className="mx-auto mb-8 flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/etoos247-bi.png"
              alt="이투스247학원"
              className="h-10 w-auto object-contain sm:h-11"
            />
          </div>

          <h1 className="mx-auto text-4xl font-semibold leading-[1.16] tracking-tight text-slate-950 sm:text-6xl lg:text-[72px] xl:text-[82px]">
            최고의 멘토와 전국 지점을
            <br />
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-lime-600 bg-clip-text text-transparent">
              가장 정확하게 연결합니다
            </span>
          </h1>

          <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
            >
              로그인하기 (멘토 · 지점 · 본사)
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/90 px-7 py-3.5 text-sm font-semibold text-slate-800 shadow-xs backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white sm:w-auto"
            >
              247멘토단 회원가입 (초대 코드)
            </Link>
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute bottom-8 flex flex-col items-center gap-1.5 text-xs font-medium text-slate-400"
        >
          <span>Scroll to explore</span>
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </motion.div>
      </section>

      {/* Section 1.5: 멘토단 소개 영상 섹션 (YouTube 임베드 + 스크롤 확장) */}
      <section
        ref={videoSectionRef}
        className="relative z-10 mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-20"
      >
        <motion.div
          style={{ scale: videoScale, borderRadius: videoRadius }}
          className="relative overflow-hidden border border-slate-200/80 bg-slate-950 shadow-2xl shadow-slate-900/15"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-24 bg-gradient-to-tr from-teal-600/20 via-transparent to-lime-500/20 blur-3xl"
          />

          <div className="relative aspect-video w-full">
            <iframe
              src="https://www.youtube.com/embed/MkiROT4nUVw?rel=0&modestbranding=1"
              title="247멘토단 소개 영상"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        </motion.div>
      </section>

      {/* Section 2: Sticky 3단계 매칭 스토리텔링 */}
      <section ref={storyRef} className="relative z-10 mx-auto max-w-[1400px] px-4 py-24 sm:px-6">
        <div className="mb-14 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
            How It Works
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            등록부터 매칭까지,
            <br />
            세 단계로 완성되는 멘토 섭외
          </h2>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {/* 좌측: 스크롤 진행에 따라 강조되는 3단계 설명 */}
          <div className="space-y-24 py-6 lg:space-y-36">
            {STORY_STEPS.map((item, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={item.step}
                  onClick={() => setActiveStep(idx)}
                  className={`cursor-pointer border-l-2 pl-6 transition-all duration-300 ${
                    isActive
                      ? 'border-teal-700 opacity-100'
                      : 'border-slate-200 opacity-40 hover:opacity-75'
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-teal-700">
                    STEP {item.step}
                  </span>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 우측: Sticky UI 프리뷰 카드 */}
          <div className="lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-md sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                  <span className="text-xs font-bold text-slate-800">
                    STEP 0{activeStep + 1} · {STORY_STEPS[activeStep].title}
                  </span>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  Live Preview
                </span>
              </div>

              {activeStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold text-slate-500">멘토 기본 스펙</p>
                    <p className="mt-1 text-base font-bold text-slate-950">
                      김서연 · 서울대학교 수학교육과 (재학)
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {['수학', '통합과학', '월·수·금', '3~4만 원'].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 p-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-teal-700" />
                      활동 가능 지점 선택
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['대치', '서울송파', '위례', '분당정자'].map((b, i) => (
                        <span
                          key={b}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            i < 3
                              ? 'bg-slate-950 text-white'
                              : 'border border-slate-200 text-slate-500'
                          }`}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                    <Filter className="h-4 w-4 text-teal-700" />
                    <span className="rounded-full bg-teal-700 px-3 py-1 text-xs font-semibold text-white">
                      서울 · 대치
                    </span>
                    <span className="rounded-full bg-teal-700 px-3 py-1 text-xs font-semibold text-white">
                      수학
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      3~4만 원
                    </span>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-950">김서연 멘토</p>
                        <p className="text-xs text-slate-500">서울대학교 · 수학교육과</p>
                      </div>
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                        조건 100% 일치
                      </span>
                    </div>
                    <div className="mt-4 rounded-full bg-slate-950 py-2 text-center text-xs font-semibold text-white">
                      멘토링 요청 보내기
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-teal-700" />
                    <div>
                      <p className="text-sm font-bold text-teal-950">
                        멘토가 요청을 수락했습니다!
                      </p>
                      <p className="text-xs text-teal-800">
                        수락 즉시 양측 연락처가 상호 공개됩니다.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 rounded-2xl border border-slate-200/80 p-4 text-xs sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="text-slate-400">지점 담당자</span>
                      <p className="mt-1 font-bold text-slate-900">대치점 실장 · 010-9000-1111</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="text-slate-400">멘토 연락처 (공개됨)</span>
                      <p className="mt-1 font-bold text-slate-900">김서연 · 010-1111-2222</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: 전국 이투스247 네트워크 (다크 대비 섹션 + 카운트업) */}
      <section className="relative z-10 bg-slate-950 px-4 py-24 text-white sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
              Nationwide Network
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              전국 어디서든 연결되는
              <br />
              이투스247학원 지점 네트워크
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <SpotlightCard variant="dark" glowColor="rgba(255, 255, 255, 0.14)">
              <p className="text-xs font-medium text-slate-400">전국 권역</p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-white">
                <CountUpNumber target={7} suffix="개" />
              </p>
            </SpotlightCard>
            <SpotlightCard variant="dark" glowColor="rgba(45, 212, 191, 0.22)">
              <p className="text-xs font-medium text-slate-400">운영 지점</p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-teal-400">
                <CountUpNumber target={60} suffix="개" />
              </p>
            </SpotlightCard>
            <SpotlightCard variant="dark" glowColor="rgba(163, 230, 53, 0.20)">
              <p className="text-xs font-medium text-slate-400">참여 멘토</p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-lime-400">
                <CountUpNumber target={100} suffix="명" />
              </p>
            </SpotlightCard>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {REGION_HIGHLIGHTS.map((item, idx) => (
              <motion.div
                key={item.region}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
              >
                <SpotlightCard
                  variant="dark"
                  glowColor="rgba(45, 212, 191, 0.16)"
                  className="rounded-2xl px-5 py-4"
                >
                  <p className="text-sm font-bold text-white">{item.region}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.sample}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 대형 ETOOS247 워드마크 섹션 */}
      <section className="relative z-10 overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[1440px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
            className="select-none"
          >
            <p className="text-[17vw] font-bold leading-[0.88] tracking-tighter text-slate-950 sm:text-[15vw] lg:text-[210px] xl:text-[250px]">
              ETOOS<span className="text-teal-700">247</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* 하단 반투명 블러 푸터 */}
      <footer className="relative z-10 border-t border-slate-200/80 bg-white/75 px-4 py-10 backdrop-blur-xl sm:px-6">
        <div className="mx-auto max-w-[1440px]">
          {/* 상단 행: BI 로고 + 정책/안내 링크 */}
          <div className="flex flex-col justify-between gap-6 pb-7 sm:flex-row sm:items-center">
            <Link href="/" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/etoos247-bi.png"
                alt="이투스247학원"
                className="h-7 w-auto object-contain"
              />
            </Link>

            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600 sm:text-sm">
              <a
                href="https://247.etoos.com/member/privacy.do?tab=privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-slate-950"
              >
                개인정보처리방침
              </a>
              <a
                href="https://247.etoos.com/member/privacy.do?tab=terms"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-slate-950"
              >
                이용약관
              </a>
              <a
                href="https://247.etoos.com/franchise/inquiry.do"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-slate-950"
              >
                가맹문의
              </a>
              <a
                href="https://247.etoos.com/cont/history.do"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-slate-950"
              >
                브랜드 소개
              </a>
            </nav>
          </div>

          {/* 하단 행: 회사 정보 + SNS 아이콘 + TOP 버튼 */}
          <div className="flex flex-col justify-between gap-6 border-t border-slate-200/80 pt-7 sm:flex-row sm:items-center">
            <div className="space-y-1 text-xs leading-relaxed text-slate-500">
              <p>이투스이씨아이 주식회사 | 서울특별시 서초구 남부순환로 2547, 3층(서초동 1354-3)</p>
              <p className="text-slate-400">Copyright © ETOOS ECI Co.,Ltd. All rights Reserved.</p>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href="https://www.youtube.com/@etoos247"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="유튜브"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                  <path d="m10 15 5-3-5-3v6Z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/etoos247_official/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="인스타그램"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://blog.naver.com/etooseci247"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="블로그"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
              <a
                href="https://247.etoos.com/index.do"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="공식 홈페이지"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
              >
                <Globe className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="ml-1 inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white/90 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                TOP
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

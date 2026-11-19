import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { PageLoading } from '@/components/PageLoading';
import { LandingPage } from '@/components/LandingPage';

async function HomeContent() {
  const session = await getCurrentSession();

  if (session) {
    if (!session.profile.is_active) {
      redirect('/inactive');
    }
    if (session.profile.role === 'admin') redirect('/admin');
    if (session.profile.role === 'branch') redirect('/branch');
    redirect('/mentor');
  }

  return <LandingPage />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <HomeContent />
    </Suspense>
  );
}

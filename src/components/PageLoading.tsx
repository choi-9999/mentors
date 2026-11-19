import { Loader2 } from 'lucide-react';

export function PageLoading({ label = '불러오는 중...' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

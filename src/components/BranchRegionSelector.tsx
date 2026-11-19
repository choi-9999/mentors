'use client';

import { REGIONS } from '@/lib/constants';
import type { Branch } from '@/lib/types';

interface BranchRegionSelectorProps {
  branches: Branch[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function BranchRegionSelector({
  branches,
  selectedIds,
  onChange,
}: BranchRegionSelectorProps) {
  const activeBranches = branches.filter((b) => b.status === 'active');

  function toggleBranch(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function toggleRegion(regionBranches: Branch[]) {
    const regionIds = regionBranches.map((b) => b.id);
    const allSelected = regionIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onChange(selectedIds.filter((id) => !regionIds.includes(id)));
    } else {
      const merged = new Set([...selectedIds, ...regionIds]);
      onChange(Array.from(merged));
    }
  }

  return (
    <div className="space-y-3.5">
      {REGIONS.map((region) => {
        const regionBranches = activeBranches.filter((b) => b.region === region);
        if (regionBranches.length === 0) return null;

        const selectedCount = regionBranches.filter((b) => selectedIds.includes(b.id)).length;
        const allSelected = selectedCount === regionBranches.length;

        return (
          <div key={region} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">
                {region}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({selectedCount}/{regionBranches.length})
                </span>
              </span>
              <button
                type="button"
                onClick={() => toggleRegion(regionBranches)}
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                {allSelected ? '전체 해제' : '권역 전체 선택'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {regionBranches.map((branch) => {
                const checked = selectedIds.includes(branch.id);
                return (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => toggleBranch(branch.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      checked
                        ? 'border-teal-700 bg-teal-700 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {branch.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

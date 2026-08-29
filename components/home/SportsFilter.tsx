'use client';

import React from 'react';
import { Trophy, Globe } from 'lucide-react';
import { startTopLoader } from '@/components/layout/TopLoadingBar';

export interface Category {
  id: number;
  sportName: string;
  iconUrl?: string;
}

interface SportsFilterProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const SportsFilter: React.FC<SportsFilterProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
      {/* ALL SPORTS BUTTON */}
      <button
        onClick={() => {
          startTopLoader();
          onSelectCategory('all');
        }}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shrink-0 transition-all ${
          selectedCategoryId === 'all'
            ? 'bg-[var(--brand-yellow)] text-black shadow-lg shadow-yellow-500/25 scale-105'
            : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-glass)] hover:bg-[var(--bg-card-hover)] hover:text-white'
        }`}
      >
        <Globe className="h-3.5 w-3.5" />
        <span>All Sports</span>
      </button>

      {/* CATEGORIES BUTTONS */}
      {categories.map((cat) => {
        const isSelected = selectedCategoryId === String(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => {
              startTopLoader();
              onSelectCategory(String(cat.id));
            }}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shrink-0 transition-all ${
              isSelected
                ? 'bg-[var(--brand-yellow)] text-black shadow-lg shadow-yellow-500/25 scale-105'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-glass)] hover:bg-[var(--bg-card-hover)] hover:text-white'
            }`}
          >
            {cat.iconUrl ? (
              <img src={cat.iconUrl} alt="" className="h-4 w-4 object-contain" />
            ) : (
              <Trophy className="h-3.5 w-3.5 text-[var(--brand-yellow)]" />
            )}
            <span>{cat.sportName}</span>
          </button>
        );
      })}
    </div>
  );
};

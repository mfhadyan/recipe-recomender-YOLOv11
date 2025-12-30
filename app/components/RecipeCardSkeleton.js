"use client";

export default function RecipeCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border-2 border-amber-100 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 bg-amber-200 rounded w-2/3"></div>
        <div className="w-5 h-5 bg-rose-200 rounded-full"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-slate-200 rounded w-full"></div>
        <div className="h-3 bg-slate-200 rounded w-4/5"></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-3 bg-emerald-200 rounded w-16"></div>
        <div className="h-3 bg-rose-200 rounded w-16"></div>
        <div className="h-3 bg-amber-200 rounded w-12 ml-auto"></div>
      </div>
    </div>
  );
}

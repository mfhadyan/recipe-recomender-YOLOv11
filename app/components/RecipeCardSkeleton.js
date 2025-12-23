"use client";

export default function RecipeCardSkeleton() {
  return (
    <article className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-sm animate-pulse">
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-5 bg-slate-700 rounded-full w-16"></div>
        </div>
        <div className="h-3 bg-slate-700 rounded w-2/3"></div>
        <div className="mt-1 flex flex-wrap gap-1">
          <div className="h-5 bg-slate-700 rounded-full w-16"></div>
          <div className="h-5 bg-slate-700 rounded-full w-20"></div>
          <div className="h-5 bg-slate-700 rounded-full w-14"></div>
          <div className="h-5 bg-slate-700 rounded-full w-18"></div>
        </div>
        <div className="mt-1 h-3 bg-slate-700 rounded w-full"></div>
        <div className="mt-2 h-3 bg-slate-700 rounded w-32"></div>
      </div>
    </article>
  );
}


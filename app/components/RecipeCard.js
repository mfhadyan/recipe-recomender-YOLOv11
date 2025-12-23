"use client";

import { useState } from "react";
import RecipeDetailModal from "./RecipeDetailModal";

export default function RecipeCard({ recipe }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const coverage =
    typeof recipe.coverageScore === "number"
      ? Math.round(recipe.coverageScore * 100)
      : null;
  const usedCount = recipe.usedIngredientCount ?? 0;
  const missedCount = recipe.missedIngredientCount ?? 0;

  return (
    <>
      <article
        className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-sm"
      >
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-50">
              {recipe.title}
            </h3>
            {coverage !== null && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-200 ring-1 ring-emerald-500/40">
                {coverage}% match
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300">
            Uses{" "}
            <span className="font-semibold text-emerald-300">{usedCount}</span> of
            your ingredients &middot; Missing{" "}
            <span className="font-semibold text-amber-200">{missedCount}</span>
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {Array.isArray(recipe.usedIngredients) &&
              recipe.usedIngredients.slice(0, 5).map((ing, idx) => {
                const name = typeof ing === "string" ? ing : (ing.name || "");
                return (
                  <span
                    key={`used-${ing.id || name}-${idx}`}
                    className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-100 ring-1 ring-emerald-500/40"
                  >
                    {name}
                  </span>
                );
              })}
            {Array.isArray(recipe.missedIngredients) &&
              recipe.missedIngredients.slice(0, 3).map((ing, idx) => {
                const name = typeof ing === "string" ? ing : (ing.name || "");
                return (
                  <span
                    key={`missed-${ing.id || name}-${idx}`}
                    className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-100 ring-1 ring-amber-500/40"
                  >
                    + {name}
                  </span>
                );
              })}
          </div>
          {recipe.description && (
            <p className="mt-1 text-[11px] text-slate-400">{recipe.description}</p>
          )}
          {(recipe.totalTime || recipe.servings || recipe.difficulty) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recipe.totalTime && (
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {recipe.totalTime} min
                </span>
              )}
              {recipe.servings && (
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {recipe.servings} servings
                </span>
              )}
              {recipe.difficulty && (
                <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded ${
                  recipe.difficulty === "Easy" ? "bg-green-500/15 text-green-300" :
                  recipe.difficulty === "Medium" ? "bg-yellow-500/15 text-yellow-300" :
                  "bg-red-500/15 text-red-300"
                }`}>
                  {recipe.difficulty}
                </span>
              )}
            </div>
          )}
          <div className="mt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-[11px] font-medium text-sky-300 hover:text-sky-200 transition-colors"
              aria-label={`View details for ${recipe.title}`}
            >
              View recipe details →
            </button>
          </div>
        </div>
      </article>
      <RecipeDetailModal
        recipe={recipe}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

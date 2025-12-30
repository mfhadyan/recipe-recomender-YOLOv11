"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
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
        className="group rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-all border-2 border-amber-100 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-amber-900 group-hover:text-amber-700 transition">
            {recipe.title}
          </h3>
          <Heart className="w-5 h-5 text-rose-400 group-hover:fill-rose-400 transition flex-shrink-0" />
        </div>

        {recipe.description && (
          <p className="text-sm text-slate-600 mb-3">{recipe.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs mb-3">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="font-semibold">{usedCount}</span> used
          </span>
          <span className="flex items-center gap-1 text-rose-600">
            <span className="font-semibold">{missedCount}</span> missing
          </span>
          {coverage !== null && (
            <span className="ml-auto text-amber-600 font-medium">
              {coverage}%
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {Array.isArray(recipe.usedIngredients) &&
            recipe.usedIngredients.slice(0, 5).map((ing, idx) => {
              const name = typeof ing === "string" ? ing : ing.name || "";
              return (
                <span
                  key={`used-${ing.id || name}-${idx}`}
                  className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700"
                >
                  {name}
                </span>
              );
            })}
          {Array.isArray(recipe.missedIngredients) &&
            recipe.missedIngredients.slice(0, 3).map((ing, idx) => {
              const name = typeof ing === "string" ? ing : ing.name || "";
              return (
                <span
                  key={`missed-${ing.id || name}-${idx}`}
                  className="rounded-full bg-rose-100 px-2.5 py-1 text-xs text-rose-700"
                >
                  + {name}
                </span>
              );
            })}
        </div>

        {(recipe.totalTime || recipe.servings || recipe.difficulty) && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
            {recipe.totalTime && (
              <span className="flex items-center gap-1">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {recipe.totalTime} min
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {recipe.servings} servings
              </span>
            )}
            {recipe.difficulty && (
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  recipe.difficulty === "Easy"
                    ? "bg-green-100 text-green-700"
                    : recipe.difficulty === "Medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {recipe.difficulty}
              </span>
            )}
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
        >
          View full recipe →
        </button>
      </article>

      <RecipeDetailModal
        recipe={recipe}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

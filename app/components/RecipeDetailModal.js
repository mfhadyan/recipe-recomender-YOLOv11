"use client";

import { useEffect } from "react";

export default function RecipeDetailModal({ recipe, isOpen, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !recipe) return null;

  const coverage =
    typeof recipe.coverageScore === "number"
      ? Math.round(recipe.coverageScore * 100)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-modal-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="Close modal"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <header className="mb-6 pr-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h2
              id="recipe-modal-title"
              className="text-2xl font-semibold text-slate-50"
            >
              {recipe.title}
            </h2>
            {coverage !== null && (
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200 ring-1 ring-emerald-500/40 whitespace-nowrap">
                {coverage}% match
              </span>
            )}
          </div>
          {recipe.description && (
            <p className="text-sm text-slate-300">{recipe.description}</p>
          )}
          
          {(recipe.prepTime || recipe.cookTime || recipe.totalTime || recipe.servings || recipe.difficulty) && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {recipe.prepTime && (
                <div className="flex items-center gap-2 text-slate-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Prep: {recipe.prepTime} min</span>
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center gap-2 text-slate-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Cook: {recipe.cookTime} min</span>
                </div>
              )}
              {recipe.totalTime && (
                <div className="flex items-center gap-2 text-slate-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Total: {recipe.totalTime} min</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-2 text-slate-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{recipe.servings} servings</span>
                </div>
              )}
              {recipe.difficulty && (
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    recipe.difficulty === "Easy" ? "bg-green-500/15 text-green-300" :
                    recipe.difficulty === "Medium" ? "bg-yellow-500/15 text-yellow-300" :
                    "bg-red-500/15 text-red-300"
                  }`}>
                    {recipe.difficulty}
                  </span>
                </div>
              )}
            </div>
          )}
        </header>

        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-slate-50 mb-3">
              Ingredients Used
            </h3>
            {Array.isArray(recipe.usedIngredients) &&
            recipe.usedIngredients.length > 0 ? (
              <ul className="space-y-2">
                {recipe.usedIngredients.map((ing, idx) => {
                  const name = typeof ing === "string" ? ing : (ing.name || "");
                  const quantity = typeof ing === "object" ? (ing.quantity || "") : "";
                  const displayText = quantity ? `${quantity} ${name}` : name;
                  return (
                    <li
                      key={`used-${ing.id || name}-${idx}`}
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-100 ring-1 ring-emerald-500/40">
                        {displayText}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No ingredients listed</p>
            )}
          </section>

          {Array.isArray(recipe.missedIngredients) &&
            recipe.missedIngredients.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-slate-50 mb-3">
                  Missing Ingredients
                </h3>
                <ul className="space-y-2">
                  {recipe.missedIngredients.map((ing, idx) => {
                    const name = typeof ing === "string" ? ing : (ing.name || "");
                    const quantity = typeof ing === "object" ? (ing.quantity || "") : "";
                    const displayText = quantity ? `${quantity} ${name}` : name;
                    return (
                      <li
                        key={`missed-${ing.id || name}-${idx}`}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-100 ring-1 ring-amber-500/40">
                          {displayText}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

          {Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-slate-50 mb-3">
                Cooking Steps
              </h3>
              <ol className="space-y-3 list-decimal list-inside">
                {recipe.steps.map((step, idx) => (
                  <li
                    key={`step-${idx}`}
                    className="text-sm text-slate-300 leading-relaxed pl-2"
                  >
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}


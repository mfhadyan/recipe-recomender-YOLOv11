"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

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
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-4 border-amber-200 bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-6 w-6" />
        </button>

        <header className="mb-6 pr-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h2
              id="recipe-modal-title"
              className="text-3xl font-bold text-amber-900"
            >
              {recipe.title}
            </h2>
            {coverage !== null && (
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 whitespace-nowrap">
                {coverage}% match
              </span>
            )}
          </div>
          {recipe.description && (
            <p className="text-base text-slate-600">{recipe.description}</p>
          )}

          {(recipe.prepTime ||
            recipe.cookTime ||
            recipe.totalTime ||
            recipe.servings ||
            recipe.difficulty) && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {recipe.prepTime && (
                <div className="flex items-center gap-2 text-slate-700">
                  <svg
                    className="h-5 w-5 text-purple-500"
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
                  <span>
                    Prep: <strong>{recipe.prepTime} min</strong>
                  </span>
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center gap-2 text-slate-700">
                  <svg
                    className="h-5 w-5 text-rose-500"
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
                  <span>
                    Cook: <strong>{recipe.cookTime} min</strong>
                  </span>
                </div>
              )}
              {recipe.totalTime && (
                <div className="flex items-center gap-2 text-slate-700">
                  <svg
                    className="h-5 w-5 text-amber-500"
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
                  <span>
                    Total: <strong>{recipe.totalTime} min</strong>
                  </span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-2 text-slate-700">
                  <svg
                    className="h-5 w-5 text-blue-500"
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
                  <span>
                    <strong>{recipe.servings}</strong> servings
                  </span>
                </div>
              )}
              {recipe.difficulty && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      recipe.difficulty === "Easy"
                        ? "bg-green-100 text-green-700"
                        : recipe.difficulty === "Medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {recipe.difficulty}
                  </span>
                </div>
              )}
            </div>
          )}
        </header>

        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              Ingredients You Have
            </h3>
            {Array.isArray(recipe.usedIngredients) &&
            recipe.usedIngredients.length > 0 ? (
              <ul className="space-y-2">
                {recipe.usedIngredients.map((ing, idx) => {
                  const name = typeof ing === "string" ? ing : ing.name || "";
                  const quantity =
                    typeof ing === "object" ? ing.quantity || "" : "";
                  const displayText = quantity ? `${quantity} ${name}` : name;
                  return (
                    <li
                      key={`used-${ing.id || name}-${idx}`}
                      className="flex items-center gap-3 text-base"
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      <span className="rounded-full bg-emerald-100 px-4 py-2 text-emerald-900 font-medium">
                        {displayText}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No ingredients listed</p>
            )}
          </section>

          {Array.isArray(recipe.missedIngredients) &&
            recipe.missedIngredients.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-rose-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🛒</span>
                  Need to Buy
                </h3>
                <ul className="space-y-2">
                  {recipe.missedIngredients.map((ing, idx) => {
                    const name = typeof ing === "string" ? ing : ing.name || "";
                    const quantity =
                      typeof ing === "object" ? ing.quantity || "" : "";
                    const displayText = quantity ? `${quantity} ${name}` : name;
                    return (
                      <li
                        key={`missed-${ing.id || name}-${idx}`}
                        className="flex items-center gap-3 text-base"
                      >
                        <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                        <span className="rounded-full bg-rose-100 px-4 py-2 text-rose-900 font-medium">
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
              <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">👨‍🍳</span>
                Cooking Instructions
              </h3>
              <ol className="space-y-4">
                {recipe.steps.map((step, idx) => (
                  <li key={`step-${idx}`} className="flex gap-4">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-900 font-bold text-sm">
                      {idx + 1}
                    </span>
                    <p className="text-base text-slate-700 leading-relaxed pt-1">
                      {step}
                    </p>
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

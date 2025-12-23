"use client";

import RecipeCard from "./RecipeCard";
import RecipeCardSkeleton from "./RecipeCardSkeleton";

export default function RecipeList({
  recipes,
  mergedIngredients,
  detectedIngredients = [],
  manualIngredients = [],
  sortBy = "coverage",
  onSortChange,
  fallback,
  loading,
  message,
}) {
  // Create sets for quick lookup
  const detectedSet = new Set((detectedIngredients || []).map(ing => ing.toLowerCase()));
  
  return (
    <section className="flex-1 rounded-3xl bg-slate-950/80 p-6 shadow-2xl ring-1 ring-slate-800/60 backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-50">
          Matching recipes
        </h2>
        {recipes.length > 0 && !loading && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-200 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="coverage">Best Match</option>
              <option value="missing">Fewest Missing</option>
              <option value="used">Most Ingredients</option>
            </select>
          </div>
        )}
      </div>

      {mergedIngredients.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium text-slate-300">
            Using ingredients ({mergedIngredients.length} total):
          </p>
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="All ingredients">
            {mergedIngredients.map((ing) => {
              const isDetected = detectedSet.has(ing.toLowerCase());
              return (
                <span
                  key={ing}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] ring-1 ${
                    isDetected
                      ? "bg-blue-500/15 text-blue-100 ring-blue-500/40"
                      : "bg-slate-800/80 text-slate-100 ring-slate-600/70"
                  }`}
                  title={isDetected ? "Detected from image" : "Manually added"}
                >
                  {isDetected && (
                    <svg
                      className="mr-1 h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                  {ing}
                </span>
              );
            })}
          </div>
          {(detectedIngredients?.length > 0 || manualIngredients?.length > 0) && (
            <p className="text-[10px] text-slate-400">
              {detectedIngredients?.length > 0 && (
                <span>
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500/40 mr-1" />
                  {detectedIngredients.length} from image
                </span>
              )}
              {detectedIngredients?.length > 0 && manualIngredients?.length > 0 && " • "}
              {manualIngredients?.length > 0 && (
                <span>
                  <span className="inline-block h-2 w-2 rounded-full bg-slate-600 mr-1" />
                  {manualIngredients.length} manually added
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {fallback && recipes.length > 0 && (
        <p className="mb-3 text-[11px] text-amber-200">
          No recipes met the &ldquo;max 5 missing ingredients&rdquo; rule.
          Showing the closest matches instead.
        </p>
      )}

      {loading && (
        <div className="space-y-4 overflow-y-auto pt-1" role="list" aria-label="Loading recipes">
          {[...Array(5)].map((_, idx) => (
            <RecipeCardSkeleton key={`skeleton-${idx}`} />
          ))}
        </div>
      )}

      {recipes.length === 0 && !loading && !message && (
        <p className="mt-8 text-sm text-slate-400">
          Upload an image and optionally add ingredients to see recipe
          suggestions here.
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {message}
        </p>
      )}

      {recipes.length > 0 && !loading && (
        <div className="space-y-4 overflow-y-auto pt-1" role="list" aria-label="Recipe suggestions">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </section>
  );
}

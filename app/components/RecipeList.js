"use client";

import { ChefHat } from "lucide-react";
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
  const detectedSet = new Set(
    (detectedIngredients || []).map((ing) => ing.toLowerCase())
  );

  if (loading) {
    return (
      <section className="lg:col-span-3">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-rose-300 border-t-rose-600 rounded-full animate-spin mb-4" />
          <p className="text-lg font-medium text-slate-700">
            Cooking up some ideas...
          </p>
        </div>
      </section>
    );
  }

  if (recipes.length === 0) {
    return (
      <section className="lg:col-span-3">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-amber-100 p-8 mb-6">
            <ChefHat className="w-16 h-16 text-amber-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">
            Ready to Cook? 👨‍🍳
          </h3>
          <p className="text-slate-600 max-w-md">
            Upload a photo of your ingredients or add them manually to discover
            recipes you can make right now!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="lg:col-span-3">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>🎉</span>
            Found {recipes.length} Delicious{" "}
            {recipes.length === 1 ? "Recipe" : "Recipes"}!
          </h2>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-xl border-2 border-purple-200 bg-white px-4 py-2 text-sm font-medium text-purple-900 focus:border-purple-400 focus:outline-none"
          >
            <option value="coverage">Best Match</option>
            <option value="missing">Fewest Missing</option>
            <option value="used">Most Used</option>
          </select>
        </div>

        {fallback && (
          <p className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No recipes met the &ldquo;max 5 missing ingredients&rdquo; rule.
            Showing the closest matches instead.
          </p>
        )}

        {mergedIngredients.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-5 border-2 border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              Your Ingredients ({mergedIngredients.length} total):
            </h3>
            <div className="flex flex-wrap gap-2">
              {mergedIngredients.map((ing) => {
                const isDetected = detectedSet.has(ing.toLowerCase());
                return (
                  <span
                    key={ing}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium shadow-sm ${
                      isDetected
                        ? "bg-blue-400 text-white"
                        : "bg-white text-blue-900"
                    }`}
                    title={
                      isDetected
                        ? "Detected from image 📷"
                        : "Manually added ✍️"
                    }
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
            {(detectedIngredients?.length > 0 ||
              manualIngredients?.length > 0) && (
              <p className="text-xs text-blue-700 mt-3">
                {detectedIngredients?.length > 0 && (
                  <span>📷 {detectedIngredients.length} from image</span>
                )}
                {detectedIngredients?.length > 0 &&
                  manualIngredients?.length > 0 &&
                  " • "}
                {manualIngredients?.length > 0 && (
                  <span>✍️ {manualIngredients.length} manually added</span>
                )}
              </p>
            )}
          </div>
        )}

        {message && (
          <p className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        )}

        <div className="space-y-4">
          {recipes.map((recipe, i) => (
            <RecipeCard key={recipe.id || i} recipe={recipe} />
          ))}
        </div>
      </div>
    </section>
  );
}

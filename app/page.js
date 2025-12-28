"use client";

import { useState, useMemo } from "react";
import ImageUploader from "./components/ImageUploader";
import IngredientInput from "./components/IngredientInput";
import RecipeList from "./components/RecipeList";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function Home() {
  const [file, setFile] = useState(null);
  const [ingredientInput, setIngredientInput] = useState("");
  const [extraIngredients, setExtraIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [mergedIngredients, setMergedIngredients] = useState([]);
  const [detectedIngredients, setDetectedIngredients] = useState([]);
  const [manualIngredients, setManualIngredients] = useState([]);
  const [dietaryPreferences, setDietaryPreferences] = useState([]);
  const [sortBy, setSortBy] = useState("coverage");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (f) => {
    setError("");
    setMessage("");
    setRecipes([]);
    setMergedIngredients([]);
    setDetectedIngredients([]);
    setManualIngredients([]);
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setRecipes([]);
    setMergedIngredients([]);
    setDetectedIngredients([]);
    setManualIngredients([]);
    setFallback(false);

    if (!file && extraIngredients.length === 0) {
      setError("Please upload an image or add at least one ingredient.");
      return;
    }

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    if (extraIngredients.length > 0) {
      formData.append("extra_ingredients", extraIngredients.join(","));
    }
    if (dietaryPreferences.length > 0) {
      formData.append("dietary_preferences", dietaryPreferences.join(","));
    }

    setLoading(true);
    try {
      // Log the API URL for debugging (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log("API Base URL:", API_BASE_URL);
      }

      const res = await fetch(`${API_BASE_URL}/recommend`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}: `;
        try {
          const errorData = await res.json();
          errorMsg += errorData?.detail || errorData?.message || res.statusText;
        } catch {
          errorMsg += res.statusText || "Unknown error";
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();

      setMergedIngredients(data.ingredients || []);
      setDetectedIngredients(data.detectedIngredients || []);
      setManualIngredients(data.manualIngredients || []);
      setRecipes(data.recipes || []);
      setFallback(Boolean(data.fallback));
      if (data.message) {
        setMessage(data.message);
      }
      
      // Log ingredient breakdown for debugging
      if (data.detectedIngredients || data.manualIngredients) {
        console.log("Detected from image:", data.detectedIngredients || []);
        console.log("Manually added:", data.manualIngredients || []);
        console.log("Merged total:", data.ingredients || []);
      }
    } catch (err) {
      console.error("Error fetching recipes:", err);
      
      // Provide more helpful error messages
      let errorMessage = err.message || "Failed to fetch recipes. Please try again.";
      
      // Check if it's a network error (likely CORS or wrong URL)
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError") || err.name === "TypeError") {
        if (API_BASE_URL === "http://localhost:8000") {
          errorMessage = "Backend API URL not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable in Vercel with your backend URL.";
        } else {
          errorMessage = `Cannot connect to backend API at ${API_BASE_URL}. Please check: 1) Backend is running, 2) CORS is configured correctly, 3) API URL is correct.`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Sort recipes based on current sortBy value
  const sortedRecipes = useMemo(() => {
    if (recipes.length === 0) return recipes;
    
    return [...recipes].sort((a, b) => {
      switch (sortBy) {
        case "coverage":
          return (b.coverageScore || 0) - (a.coverageScore || 0);
        case "missing":
          return (a.missedIngredientCount || 0) - (b.missedIngredientCount || 0);
        case "used":
          return (b.usedIngredientCount || 0) - (a.usedIngredientCount || 0);
        default:
          return 0;
      }
    });
  }, [recipes, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 lg:flex-row lg:py-16">
        <section className="flex-1 rounded-3xl bg-slate-950/70 p-6 shadow-2xl ring-1 ring-slate-800/60 backdrop-blur">
          <header className="mb-6 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              AI Recipe Recommender
            </h1>
            <p className="max-w-xl text-sm text-slate-300">
              Upload a photo of your ingredients and optionally add more by
              typing. We&apos;ll detect what&apos;s in the image and suggest
              recipes that use at least most of what you have.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <ImageUploader file={file} onFileChange={handleFileChange} error={error} setError={setError} />

            <IngredientInput
              ingredientInput={ingredientInput}
              setIngredientInput={setIngredientInput}
              extraIngredients={extraIngredients}
              setExtraIngredients={setExtraIngredients}
              setError={setError}
              setMessage={setMessage}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                Dietary Preferences (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Nut-free"].map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => {
                      setDietaryPreferences((prev) =>
                        prev.includes(pref)
                          ? prev.filter((p) => p !== pref)
                          : [...prev, pref]
                      );
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      dietaryPreferences.includes(pref)
                        ? "bg-sky-500 text-slate-950 ring-2 ring-sky-400"
                        : "bg-slate-800/80 text-slate-200 ring-1 ring-slate-600/70 hover:bg-slate-800"
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            {message && (
              <p className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || (!file && extraIngredients.length === 0)}
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Finding recipes..." : "Find recipes"}
            </button>

            <p className="text-[11px] leading-relaxed text-slate-400">
              Your image is processed only in memory and never stored on the
              server. Recipe data is generated using AI.
            </p>
          </form>
        </section>

        <RecipeList
          recipes={sortedRecipes}
          mergedIngredients={mergedIngredients}
          detectedIngredients={detectedIngredients}
          manualIngredients={manualIngredients}
          sortBy={sortBy}
          onSortChange={setSortBy}
          fallback={fallback}
          loading={loading}
          message={message}
        />
      </main>
    </div>
  );
}


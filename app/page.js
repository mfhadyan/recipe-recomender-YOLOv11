"use client";

import { useState, useMemo } from "react";
import ImageUploader from "./components/ImageUploader";
import IngredientInput from "./components/IngredientInput";
import RecipeList from "./components/RecipeList";
import { UtensilsCrossed, Sparkles, ChefHat, Heart } from "lucide-react";

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

  const handleSubmit = async () => {
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
      if (process.env.NODE_ENV === "development") {
        console.log("API Base URL:", API_BASE_URL);
      }

      const apiUrl = `${API_BASE_URL}/recommend`;
      console.log("Making request to:", apiUrl);

      const res = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", res.status, res.statusText);
      console.log(
        "Response headers:",
        Object.fromEntries(res.headers.entries())
      );

      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}: `;
        try {
          const errorData = await res.json();
          errorMsg += errorData?.detail || errorData?.message || res.statusText;
        } catch {
          const text = await res.text();
          errorMsg += text || res.statusText || "Unknown error";
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

      if (data.detectedIngredients || data.manualIngredients) {
        console.log("Detected from image:", data.detectedIngredients || []);
        console.log("Manually added:", data.manualIngredients || []);
        console.log("Merged total:", data.ingredients || []);
      }
    } catch (err) {
      console.error("Error fetching recipes:", err);

      let errorMessage =
        err.message || "Failed to fetch recipes. Please try again.";

      if (
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError") ||
        err.name === "TypeError"
      ) {
        if (API_BASE_URL === "http://localhost:8000") {
          errorMessage =
            "Backend API URL not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable in Vercel with your backend URL.";
        } else {
          errorMessage = `Cannot connect to backend API at ${API_BASE_URL}. Please check: 1) Backend is running, 2) CORS is configured correctly, 3) API URL is correct.`;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sortedRecipes = useMemo(() => {
    if (recipes.length === 0) return recipes;

    return [...recipes].sort((a, b) => {
      switch (sortBy) {
        case "coverage":
          return (b.coverageScore || 0) - (a.coverageScore || 0);
        case "missing":
          return (
            (a.missedIngredientCount || 0) - (b.missedIngredientCount || 0)
          );
        case "used":
          return (b.usedIngredientCount || 0) - (a.usedIngredientCount || 0);
        default:
          return 0;
      }
    });
  }, [recipes, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-purple-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-rose-400 via-amber-300 to-purple-400 py-8 px-6 shadow-lg">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-3 mb-3">
            <UtensilsCrossed className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-bold text-white">
              BearyGood
            </h1>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-center text-white/90 text-lg">
            Discover delicious recipes with what you have! 🍳✨
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left Panel - Input Section */}
          <section className="lg:col-span-2">
            <div className="sticky top-6 rounded-3xl bg-white p-6 shadow-xl border-4 border-rose-200">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-rose-900 mb-2 flex items-center gap-2">
                  <ChefHat className="w-6 h-6" />
                  What&apos;s in Your Kitchen?
                </h2>
                <p className="text-sm text-slate-600">
                  Snap a photo or type your ingredients, and let&apos;s cook
                  something amazing!
                </p>
              </div>

              <div className="space-y-6">
                <ImageUploader
                  file={file}
                  onFileChange={handleFileChange}
                  error={error}
                  setError={setError}
                />

                <IngredientInput
                  ingredientInput={ingredientInput}
                  setIngredientInput={setIngredientInput}
                  extraIngredients={extraIngredients}
                  setExtraIngredients={setExtraIngredients}
                  setError={setError}
                  setMessage={setMessage}
                />

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-emerald-900">
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Dietary Preferences
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Vegetarian",
                      "Vegan",
                      "Gluten-free",
                      "Dairy-free",
                      "Nut-free",
                    ].map((pref) => (
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
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                          dietaryPreferences.includes(pref)
                            ? "bg-emerald-500 text-white shadow-md scale-105"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border-2 border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {message}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading || (!file && extraIngredients.length === 0)}
                  className="w-full rounded-2xl bg-gradient-to-r from-rose-400 to-amber-400 px-6 py-4 text-lg font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      Finding delicious recipes...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Find My Recipes!
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  🔒 Your images are processed securely and never stored.
                  Privacy first!
                </p>
              </div>
            </div>
          </section>

          {/* Right Panel - Recipe Results */}
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
        </div>
      </main>
    </div>
  );
}

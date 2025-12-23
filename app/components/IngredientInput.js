"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function IngredientInput({
  ingredientInput,
  setIngredientInput,
  extraIngredients,
  setExtraIngredients,
  setError,
  setMessage,
}) {
  const validateIngredient = (ingredient) => {
    const trimmed = ingredient.trim();
    if (!trimmed) {
      return { valid: false, error: "Ingredient name cannot be empty." };
    }
    if (trimmed.length < 2) {
      return { valid: false, error: "Ingredient name must be at least 2 characters." };
    }
    if (trimmed.length > 50) {
      return { valid: false, error: "Ingredient name must be 50 characters or less." };
    }
    // Allow letters, numbers, spaces, hyphens, and apostrophes
    const validPattern = /^[a-zA-Z0-9\s\-']+$/;
    if (!validPattern.test(trimmed)) {
      return { valid: false, error: "Ingredient name contains invalid characters. Use only letters, numbers, spaces, hyphens, and apostrophes." };
    }
    return { valid: true, error: null };
  };

  const handleAddIngredients = () => {
    const raw = ingredientInput.trim();
    if (!raw) return;

    // Parse comma-separated ingredients
    const ingredients = raw
      .split(",")
      .map((ing) => ing.trim())
      .filter((ing) => ing.length > 0);

    if (ingredients.length === 0) {
      setError("Please enter at least one ingredient.");
      return;
    }

    // Validate all ingredients
    const invalidIngredients = [];
    const validIngredients = [];

    for (const ing of ingredients) {
      const validation = validateIngredient(ing);
      if (validation.valid) {
        validIngredients.push(ing);
      } else {
        invalidIngredients.push(ing);
      }
    }

    if (invalidIngredients.length > 0) {
      setError(
        `Invalid ingredients: ${invalidIngredients.join(", ")}. ${invalidIngredients.length === 1 ? "It" : "They"} contain invalid characters or are too short/long.`
      );
      // Still add valid ingredients if any
      if (validIngredients.length === 0) {
        return;
      }
    } else {
      setError("");
    }

    // Add valid ingredients (avoid duplicates)
    setExtraIngredients((prev) => {
      const existingLower = new Set(prev.map((ing) => ing.toLowerCase()));
      const newIngredients = validIngredients.filter(
        (ing) => !existingLower.has(ing.toLowerCase())
      );

      if (newIngredients.length === 0 && validIngredients.length > 0) {
        setError("All ingredients are already added.");
        return prev;
      }

      if (newIngredients.length < validIngredients.length) {
        const skipped = validIngredients.length - newIngredients.length;
        setError(
          `${skipped} ingredient${skipped === 1 ? " was" : "s were"} already added.`
        );
      }

      return [...prev, ...newIngredients];
    });

    setIngredientInput("");
    if (invalidIngredients.length === 0) {
      setError("");
    }
    setMessage("");
  };

  const handleRemoveIngredient = (name) => {
    setExtraIngredients((prev) =>
      prev.filter((ing) => ing.toLowerCase() !== name.toLowerCase())
    );
    setError("");
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddIngredients();
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-200">
        Add ingredients manually (comma-separated)
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="e.g. garlic, tomato, pepper, egg, onion"
          value={ingredientInput}
          onChange={(e) => setIngredientInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-sky-500/0 placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
          aria-label="Ingredient names input (comma-separated)"
        />
        <button
          type="button"
          onClick={handleAddIngredients}
          className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 disabled:opacity-50"
          disabled={!ingredientInput.trim()}
        >
          Add ingredients
        </button>
      </div>
      {extraIngredients.length > 0 && (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Added ingredients">
          {extraIngredients.map((ing) => (
            <button
              key={ing}
              type="button"
              onClick={() => handleRemoveIngredient(ing)}
              className="group inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-100 ring-1 ring-slate-600/70 hover:bg-red-500/90 hover:text-white hover:ring-red-400"
              aria-label={`Remove ${ing}`}
            >
              <span>{ing}</span>
              <span className="text-slate-300 group-hover:text-white">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


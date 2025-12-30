"use client";

import { Plus, X } from "lucide-react";

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
      return {
        valid: false,
        error: "Ingredient name must be at least 2 characters.",
      };
    }
    if (trimmed.length > 50) {
      return {
        valid: false,
        error: "Ingredient name must be 50 characters or less.",
      };
    }
    const validPattern = /^[a-zA-Z0-9\s\-']+$/;
    if (!validPattern.test(trimmed)) {
      return {
        valid: false,
        error: "Ingredient name contains invalid characters.",
      };
    }
    return { valid: true, error: null };
  };

  const handleAddIngredients = () => {
    const raw = ingredientInput.trim();
    if (!raw) return;

    const ingredients = raw
      .split(",")
      .map((ing) => ing.trim())
      .filter((ing) => ing.length > 0);

    if (ingredients.length === 0) {
      setError("Please enter at least one ingredient.");
      return;
    }

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
        `Invalid ingredients: ${invalidIngredients.join(", ")}. ${
          invalidIngredients.length === 1 ? "It" : "They"
        } contain invalid characters or are too short/long.`
      );
      if (validIngredients.length === 0) {
        return;
      }
    } else {
      setError("");
    }

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
          `${skipped} ingredient${
            skipped === 1 ? " was" : "s were"
          } already added.`
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
      <label className="block text-sm font-medium text-purple-900">
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add More Ingredients
        </span>
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={ingredientInput}
          onChange={(e) => setIngredientInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., tomatoes, cheese, pasta..."
          className="flex-1 rounded-xl border-2 border-purple-200 bg-white px-4 py-2.5 text-sm text-purple-900 placeholder:text-purple-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
        <button
          type="button"
          onClick={handleAddIngredients}
          disabled={!ingredientInput.trim()}
          className="rounded-xl bg-purple-500 px-4 py-2.5 text-white hover:bg-purple-600 transition disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {extraIngredients.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {extraIngredients.map((ing) => (
            <span
              key={ing}
              className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-900"
            >
              {ing}
              <button
                type="button"
                onClick={() => handleRemoveIngredient(ing)}
                className="hover:text-purple-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

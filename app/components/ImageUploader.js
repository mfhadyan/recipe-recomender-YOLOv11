"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function ImageUploader({ file, onFileChange, error, setError }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateFile = (f) => {
    setValidationError("");

    // Check file type
    if (!f.type || !f.type.startsWith("image/")) {
      setValidationError(
        "Please select an image file (JPG, PNG, WebP, or GIF)."
      );
      if (setError)
        setError("Please select an image file (JPG, PNG, WebP, or GIF).");
      return false;
    }

    // Check if type is in allowed list
    if (!ALLOWED_TYPES.includes(f.type.toLowerCase())) {
      setValidationError(
        `File type "${f.type}" is not supported. Please use JPG, PNG, WebP, or GIF.`
      );
      if (setError)
        setError(
          `File type "${f.type}" is not supported. Please use JPG, PNG, WebP, or GIF.`
        );
      return false;
    }

    // Check file size
    if (f.size > MAX_FILE_SIZE) {
      const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
      const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      setValidationError(
        `File is too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`
      );
      if (setError)
        setError(
          `File is too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`
        );
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (validateFile(f)) {
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
        onFileChange(f);
        if (setError) setError("");
      } else {
        setPreviewUrl(null);
        onFileChange(null);
      }
    } else {
      setPreviewUrl(null);
      onFileChange(null);
      setValidationError("");
      if (setError) setError("");
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-200">
        Ingredient photo
      </label>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <label
          className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-200 shadow-inner hover:border-sky-500 hover:bg-slate-900"
          aria-label="Choose ingredient image"
        >
          <span>Choose image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-describedby="image-upload-help"
          />
        </label>
        {file ? (
          <p className="text-xs text-slate-300">
            Selected:{" "}
            <span className="font-medium text-slate-100">{file.name}</span>
          </p>
        ) : (
          <p id="image-upload-help" className="text-xs text-slate-400">
            PNG, JPG, WebP, GIF up to 10MB. Processed only in-memory.
          </p>
        )}
      </div>
      {previewUrl && (
        <div className="relative mt-3 h-64 w-full overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/70">
          <Image
            src={previewUrl}
            alt="Ingredient preview"
            fill
            className="object-cover"
          />
        </div>
      )}
      {validationError && (
        <p className="rounded-lg border border-red-500/70 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {validationError}
        </p>
      )}
      {error && !validationError && (
        <p className="rounded-lg border border-red-500/70 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}

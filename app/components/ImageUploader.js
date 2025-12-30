"use client";

import { useState, useEffect } from "react";
import NextImage from "next/image";
import { Upload, ChefHat } from "lucide-react";

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

    if (!f.type || !f.type.startsWith("image/")) {
      setValidationError(
        "Please select an image file (JPG, PNG, WebP, or GIF)."
      );
      if (setError)
        setError("Please select an image file (JPG, PNG, WebP, or GIF).");
      return false;
    }

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

  const compressImage = (
    file,
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85
  ) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (validateFile(f)) {
        const compressedFile = await compressImage(f);
        const url = URL.createObjectURL(compressedFile);
        setPreviewUrl(url);
        onFileChange(compressedFile);
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
    <div className="space-y-3">
      <label className="block text-sm font-medium text-rose-900">
        <span className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Ingredient Photo
        </span>
      </label>
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50 px-6 py-10 text-center transition hover:border-rose-400 hover:bg-rose-100"
        >
          {file ? (
            <div className="space-y-2">
              <ChefHat className="mx-auto h-10 w-10 text-rose-500" />
              <p className="text-sm font-medium text-rose-900">{file.name}</p>
              <p className="text-xs text-rose-600">Click to change image</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto h-10 w-10 text-rose-400" />
              <p className="text-sm font-medium text-rose-900">
                Drop your image here
              </p>
              <p className="text-xs text-rose-600">
                or click to browse • PNG, JPG, WebP, GIF up to 10MB
              </p>
            </div>
          )}
        </label>
      </div>

      {previewUrl && (
        <div className="relative mt-3 h-64 w-full overflow-hidden rounded-2xl border-2 border-rose-200 bg-white">
          <NextImage
            src={previewUrl}
            alt="Ingredient preview"
            fill
            className="object-cover"
          />
        </div>
      )}

      {validationError && (
        <p className="rounded-xl border-2 border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {validationError}
        </p>
      )}
    </div>
  );
}

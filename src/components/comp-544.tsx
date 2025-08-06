"use client"

import { AlertCircleIcon, ImageUpIcon, XIcon } from "lucide-react"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useEffect, useState } from "react"
import { getImagePalette } from "@/lib/color-palette"

function ColorSwatchGrid({ colors }: { colors: string[] }) {
  if (!colors.length) return null;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
      {colors.map((color, idx) => (
        <div
          key={color + idx}
          className="h-10 w-full rounded-lg border flex items-center justify-center"
          style={{ background: color }}
        >
          <span className="text-xs font-mono text-white drop-shadow" style={{ color: color === '#ffffff' ? '#222' : '#fff' }}>{color}</span>
        </div>
      ))}
    </div>
  );
}

interface UploaderWithPaletteProps {
  onPaletteChange?: (palette: string[]) => void;
}

function UploaderWithPalette({ onPaletteChange }: UploaderWithPaletteProps) {
  const maxSizeMB = 5;
  const maxSize = maxSizeMB * 1024 * 1024;

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "image/*",
    maxSize,
  });

  const previewUrl = files[0]?.preview || null;
  const [palette, setPalette] = useState<string[]>([]);
  const [paletteError, setPaletteError] = useState<string>("");

  useEffect(() => {
    if (previewUrl) {
      setPaletteError("");
      getImagePalette(previewUrl, 6)
        .then((colors) => {
          setPalette(colors);
          if (typeof onPaletteChange === 'function') onPaletteChange(colors);
        })
        .catch(() => {
          setPalette([]);
          if (typeof onPaletteChange === 'function') onPaletteChange([]);
          setPaletteError("Could not extract colors from image.");
        });
    } else {
      setPalette([]);
      if (typeof onPaletteChange === 'function') onPaletteChange([]);
      setPaletteError("");
    }
  }, [previewUrl, onPaletteChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {/* Drop area */}
        <div
          role="button"
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className="border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none has-[input:focus]:ring-[3px]"
        >
          <input
            {...getInputProps()}
            className="sr-only"
            aria-label="Upload file"
          />
          {previewUrl ? (
            <div className="absolute inset-0">
              <img
                src={previewUrl}
                alt={files[0]?.file?.name || "Uploaded image"}
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div
                className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                aria-hidden="true"
              >
                <ImageUpIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">
                Drop your image here or click to browse
              </p>
              <p className="text-muted-foreground text-xs">
                Max size: {maxSizeMB}MB
              </p>
            </div>
          )}
        </div>
        {previewUrl && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              className="focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]"
              onClick={() => removeFile(files[0]?.id)}
              aria-label="Remove image"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}
      {paletteError && (
        <div className="text-destructive flex items-center gap-1 text-xs" role="alert">
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{paletteError}</span>
        </div>
      )}
      <ColorSwatchGrid colors={palette} />
      <p
        aria-live="polite"
        role="region"
        className="text-muted-foreground mt-2 text-center text-xs"
      >
        Single image uploader w/ max size ∙{" "}
        <a
          href="https://github.com/origin-space/originui/tree/main/docs/use-file-upload.md"
          className="hover:text-foreground underline"
        >
          API
        </a>
      </p>
    </div>
  );
}

export default UploaderWithPalette;

"use client"

import UploaderWithPalette from "@/components/comp-544";
import GradientGallery from "@/components/GradientGallery";
import { useState } from "react";

export default function Home() {
  const [palette, setPalette] = useState<string[]>([]);

  return (
    <div className="font-sans min-h-screen flex flex-col items-center justify-center p-8 sm:p-20 bg-background">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <UploaderWithPalette onPaletteChange={setPalette} />
        {palette.length > 0 && (
          <GradientGallery
            gradients={[
              { type: "linear", colors: palette.slice(0, 4), angle: 45, key: "linear-1" },
              { type: "linear", colors: [...palette.slice(2, 4), ...palette.slice(0, 2)], angle: 135, key: "linear-2" },
              { type: "blob", colors: palette.slice(0, 4), key: "blob-light", variant: "light" },
              { type: "blob", colors: [...palette.slice(2), ...palette.slice(0, 2)], key: "blob-dark", variant: "dark" },
              { type: "blob", colors: [...palette.slice(1, 3), ...palette.slice(0, 2)], key: "blob-random", variant: "random" }
            ]}
            className="w-full"
          />
        )}
      </div>
    </div>
  );
}

import React from "react";
import LinearGradientCard from "./LinearGradientCard";
import BlurryBlobCard from "./BlurryBlobCard";

export type GradientGalleryItem = {
  type: "linear" | "blob";
  colors: string[];
  angle?: number;
  key?: string | number;
  variant?: "light" | "dark" | "random";
};

export type GradientGalleryProps = {
  gradients: GradientGalleryItem[];
  className?: string;
};

const componentMap = {
  linear: LinearGradientCard,
  blob: BlurryBlobCard,
};

function GradientGallery({ gradients, className = "" }: GradientGalleryProps) {
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-2 w-full ${className}`}
    >
      {gradients.map((item, idx) => {
        const Comp = componentMap[item.type];
        if (!Comp) return null;
        
        const props = {
          colors: item.colors,
          className: className,
          ...(item.type === "linear" ? { angle: item.angle } : { variant: item.variant })
        };

        return <Comp key={item.key ?? idx} {...props} />;
      })}
    </div>
  );
}

export default GradientGallery;

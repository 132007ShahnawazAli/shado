import React from "react";
import LinearGradientCard, { LinearGradientCardProps } from "./LinearGradientCard";
import BlurryBlobCard, { BlurryBlobCardProps } from "./BlurryBlobCard";

// Base type for all gradient items
type BaseGradientItem = {
  colors: string[];
  key?: string | number;
  className?: string;
};

// Individual gradient item types
type LinearGradientItem = BaseGradientItem & {
  type: "linear";
  angle?: number;
  variant?: LinearGradientCardProps["variant"];
};

type BlobGradientItem = BaseGradientItem & {
  type: "blob";
  variant?: BlurryBlobCardProps["variant"];
};

export type GradientGalleryItem = LinearGradientItem | BlobGradientItem;

export type GradientGalleryProps = {
  gradients: GradientGalleryItem[];
  className?: string;
};

// Type guard functions for each gradient type
const isLinearGradient = (item: GradientGalleryItem): item is LinearGradientItem => 
  item.type === "linear";

const isBlobGradient = (item: GradientGalleryItem): item is BlobGradientItem => 
  item.type === "blob";

// Component for rendering the appropriate gradient based on type
const GradientCard: React.FC<{ 
  item: GradientGalleryItem; 
  className?: string;
  itemKey: string | number;
}> = ({ item, className = "", itemKey }) => {
  // Extract common props without the key
  const { key, ...itemWithoutKey } = item;
  const commonProps = {
    ...itemWithoutKey,
    className: item.className || className,
    colors: item.colors,
  };

  if (isLinearGradient(item)) {
    return (
      <LinearGradientCard
        key={itemKey}
        {...commonProps}
        angle={item.angle}
        variant={item.variant || 'default'}
      />
    );
  }

  if (isBlobGradient(item)) {
    return (
      <BlurryBlobCard
        key={itemKey}
        {...commonProps}
        variant={item.variant}
      />
    );
  }

  // Fallback for unknown gradient types
  console.warn(`Unknown gradient type: ${(item as unknown as { type?: string }).type}`);
  return null;
};

function GradientGallery({ gradients, className = "" }: GradientGalleryProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-2 w-full`}>
      {gradients.map((item, index) => {
        const itemKey = item.key || `gradient-${index}`;
        return (
          <GradientCard 
            key={itemKey}
            itemKey={itemKey}
            item={item}
            className={className}
          />
        );
      })}
    </div>
  );
}

export default GradientGallery;

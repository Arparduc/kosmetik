import React from "react";
import "./ImageGallery.css";

// Import all image files from /src/assets/images using Vite's glob (no hardcoded paths)
const modules = import.meta.glob(
  "../assets/images/*.{jpg,jpeg,png,webp,svg}",
  { eager: true }
);

const images = Object.values(modules)
  .map((m) => (m && m.default) || m)
  .filter(Boolean);

export default function ImageGallery({ maxItems } = {}) {
  const list = maxItems ? images.slice(0, maxItems) : images;

  return (
    <div className="image-gallery" aria-live="polite">
      {list.map((src, i) => (
        <div className="image-item" key={src + i}>
          <img src={src} alt="" loading="lazy" />
        </div>
      ))}
    </div>
  );
}

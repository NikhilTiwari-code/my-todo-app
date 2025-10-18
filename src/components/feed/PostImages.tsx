// src/components/feed/PostImages.tsx

"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PostImagesProps {
  images: string[];
  onDoubleTap: () => void;
}

export default function PostImages({ images, onDoubleTap }: PostImagesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastTapRef = useRef<number>(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleImageClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      onDoubleTap();
    }
    lastTapRef.current = now;
  };

  return (
    <div className="relative aspect-square bg-black">
      {/* Main Image */}
      <div className="relative w-full h-full">
        <Image
          src={images[currentIndex]}
          alt={`Post image ${currentIndex + 1}`}
          fill
          className="object-contain"
          onClick={handleImageClick}
          priority={currentIndex === 0}
        />
      </div>

      {/* Navigation Arrows (only if multiple images) */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition ${
                  index === currentIndex
                    ? "bg-blue-500 w-6"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
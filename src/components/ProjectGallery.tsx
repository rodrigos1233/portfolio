import { useState } from 'react';
import { ImageModal } from '@/components/ImageModal';
import { Button } from '@/components/ui/button';

interface ProjectGalleryProps {
  images: string[];
  alt: string;
  cols?: number;
  rows?: number;
}

export function ProjectGallery({ images, alt, cols = 4, rows = 1 }: ProjectGalleryProps) {
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (images.length === 0) return null;

  const limit = cols * rows;
  const hasOverflow = images.length > limit;
  const visibleImages = expanded ? images : images.slice(0, limit);
  const hiddenCount = images.length - limit;

  return (
    <div className="mt-8 pt-8 border-t border-neutral-200">
      <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4">
        Gallery
      </h2>
      <div
        className="grid gap-1.5 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {visibleImages.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setModalIndex(i)}
            className="relative block aspect-square overflow-hidden border border-neutral-200 hover:border-neutral-400 transition-colors cursor-pointer"
          >
            <img
              src={url}
              alt={`${alt} screenshot ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
      {hasOverflow && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-3"
        >
          {expanded ? 'Show less' : `+${hiddenCount} more`}
        </Button>
      )}

      {modalIndex !== null && (
        <ImageModal
          images={images}
          currentIndex={modalIndex}
          onClose={() => setModalIndex(null)}
          onNavigate={setModalIndex}
          alt={alt}
        />
      )}
    </div>
  );
}

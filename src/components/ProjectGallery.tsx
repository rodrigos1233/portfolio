import { useState } from 'react';
import { ImageModal } from '@/components/ImageModal';
import { Button } from '@/components/ui/button';
import {
  trackPortfolioInteraction,
  type GalleryImagePositionBucket,
  type PortfolioInteractionEvent,
} from '@/lib/analytics';

interface ProjectGalleryProps {
  projectId: string;
  images: string[];
  alt: string;
  cols?: number;
  rows?: number;
}

type GalleryInteractionEvent =
  | Extract<PortfolioInteractionEvent, { type: 'gallery_expand' }>
  | Extract<PortfolioInteractionEvent, { type: 'gallery_image_open' }>;

function getImagePositionBucket(index: number): GalleryImagePositionBucket {
  if (index === 0) return '1';
  if (index < 4) return '2-4';
  return '5+';
}

export function ProjectGallery({
  projectId,
  images,
  alt,
  cols = 4,
  rows = 1,
}: ProjectGalleryProps) {
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (images.length === 0) return null;

  const limit = cols * rows;
  const hasOverflow = images.length > limit;
  const visibleImages = expanded ? images : images.slice(0, limit);
  const hiddenCount = images.length - limit;

  const trackInteractionSafely = (event: GalleryInteractionEvent) => {
    try {
      void trackPortfolioInteraction(event).catch(() => {});
    } catch {
      // Preserve gallery interactions even if analytics fails.
    }
  };

  const handleImageClick = (index: number) => {
    trackInteractionSafely({
      type: 'gallery_image_open',
      projectId,
      imagePositionBucket: getImagePositionBucket(index),
    });
    setModalIndex(index);
  };

  const handleExpandClick = () => {
    if (!expanded) {
      trackInteractionSafely({ type: 'gallery_expand', projectId });
    }

    setExpanded(!expanded);
  };

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
            onClick={() => handleImageClick(i)}
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
          onClick={handleExpandClick}
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

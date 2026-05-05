const ANALYTICS_ENDPOINT = '/api/track';

type ProjectScopedEventType =
  | 'project_open'
  | 'back_to_list'
  | 'gallery_expand';

export type GalleryImagePositionBucket = '1' | '2-4' | '5+';

export type PortfolioInteractionEvent =
  | {
      type: ProjectScopedEventType;
      projectId: string;
    }
  | {
      type: 'external_link_click';
      projectId: string;
      linkType: string;
    }
  | {
      type: 'gallery_image_open';
      projectId: string;
      imagePositionBucket: GalleryImagePositionBucket;
    }
  | {
      type: 'filter';
      tag: string;
    };

let previousEvent: PortfolioInteractionEvent | null = null;

function isGalleryImagePositionBucket(
  value: string,
): value is GalleryImagePositionBucket {
  return value === '1' || value === '2-4' || value === '5+';
}

function getValidEvent(event: PortfolioInteractionEvent) {
  const normalizedType = event.type.trim();

  if (normalizedType.length === 0) {
    return null;
  }

  switch (normalizedType) {
    case 'project_open':
    case 'gallery_expand':
    case 'back_to_list': {
      const normalizedProjectId = event.projectId?.trim();
      if (!normalizedProjectId) {
        return null;
      }

      return {
        type: normalizedType,
        projectId: normalizedProjectId,
      };
    }
    case 'gallery_image_open': {
      const normalizedProjectId = event.projectId?.trim();
      const normalizedImagePositionBucket = event.imagePositionBucket?.trim();

      if (
        !normalizedProjectId ||
        !normalizedImagePositionBucket ||
        !isGalleryImagePositionBucket(normalizedImagePositionBucket)
      ) {
        return null;
      }

      return {
        type: normalizedType,
        projectId: normalizedProjectId,
        imagePositionBucket: normalizedImagePositionBucket,
      };
    }
    case 'external_link_click': {
      const normalizedProjectId = event.projectId?.trim();
      const normalizedLinkType = event.linkType?.trim();

      if (!normalizedProjectId || !normalizedLinkType) {
        return null;
      }

      return {
        type: normalizedType,
        projectId: normalizedProjectId,
        linkType: normalizedLinkType,
      };
    }
    case 'filter': {
      const normalizedTag = event.tag?.trim();
      if (!normalizedTag) {
        return null;
      }

      return {
        type: normalizedType,
        tag: normalizedTag,
      };
    }
    default:
      return null;
  }
}

async function sendAnonymousPair(
  from: PortfolioInteractionEvent,
  to: PortfolioInteractionEvent,
) {
  const payload = JSON.stringify({ from, to });

  if (typeof navigator.sendBeacon === 'function') {
    const beaconBody = new Blob([payload], { type: 'application/json' });
    const sent = navigator.sendBeacon(ANALYTICS_ENDPOINT, beaconBody);

    if (sent) {
      return;
    }
  }

  await fetch(ANALYTICS_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
    keepalive: true,
  });
}

export async function trackPortfolioInteraction(event: PortfolioInteractionEvent) {
  const validEvent = getValidEvent(event);

  if (!validEvent) {
    return;
  }

  if (previousEvent === null) {
    previousEvent = validEvent;
    return;
  }

  const fromEvent = previousEvent;
  previousEvent = validEvent;

  await sendAnonymousPair(fromEvent, validEvent);
}

export function __resetAnalyticsForTests() {
  previousEvent = null;
}

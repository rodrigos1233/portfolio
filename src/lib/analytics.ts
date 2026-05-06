const ANALYTICS_ENDPOINT = '/api/track';

type ProjectScopedEventType =
  | 'project_open'
  | 'back_to_list'
  | 'gallery_expand';

export type PortfolioLinkType =
  | 'live'
  | 'repo'
  | 'docs'
  | 'demo'
  | 'post'
  | 'video';

export type GalleryImagePositionBucket = '1' | '2-4' | '5+';

export type PortfolioInteractionEvent =
  | {
      type: ProjectScopedEventType;
      projectId: string;
    }
  | {
      type: 'external_link_click';
      projectId: string;
      linkType: PortfolioLinkType;
    }
  | {
      type: 'gallery_image_open';
      projectId: string;
      imagePositionBucket: GalleryImagePositionBucket;
    };

let previousEvent: PortfolioInteractionEvent | null = null;

function isPortfolioLinkType(value: string): value is PortfolioLinkType {
  return (
    value === 'live' ||
    value === 'repo' ||
    value === 'docs' ||
    value === 'demo' ||
    value === 'post' ||
    value === 'video'
  );
}

function isGalleryImagePositionBucket(
  value: string,
): value is GalleryImagePositionBucket {
  return value === '1' || value === '2-4' || value === '5+';
}

export function normalizePortfolioInteractionEvent(
  event: unknown,
): PortfolioInteractionEvent | null {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const rawEvent = event as Record<string, unknown>;
  if (typeof rawEvent.type !== 'string') {
    return null;
  }

  const normalizedType = rawEvent.type.trim();

  if (normalizedType.length === 0) {
    return null;
  }

  switch (normalizedType) {
    case 'project_open':
    case 'gallery_expand':
    case 'back_to_list': {
      const normalizedProjectId =
        typeof rawEvent.projectId === 'string'
          ? rawEvent.projectId.trim()
          : null;
      if (!normalizedProjectId) {
        return null;
      }

      return {
        type: normalizedType,
        projectId: normalizedProjectId,
      };
    }
    case 'gallery_image_open': {
      const normalizedProjectId =
        typeof rawEvent.projectId === 'string'
          ? rawEvent.projectId.trim()
          : null;
      const normalizedImagePositionBucket =
        typeof rawEvent.imagePositionBucket === 'string'
          ? rawEvent.imagePositionBucket.trim()
          : null;

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
      const normalizedProjectId =
        typeof rawEvent.projectId === 'string'
          ? rawEvent.projectId.trim()
          : null;
      const normalizedLinkType =
        typeof rawEvent.linkType === 'string'
          ? rawEvent.linkType.trim()
          : null;

      if (
        !normalizedProjectId ||
        !normalizedLinkType ||
        !isPortfolioLinkType(normalizedLinkType)
      ) {
        return null;
      }

      return {
        type: normalizedType,
        projectId: normalizedProjectId,
        linkType: normalizedLinkType,
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
  const validEvent = normalizePortfolioInteractionEvent(event);

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

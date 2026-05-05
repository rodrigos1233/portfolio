const ANALYTICS_ENDPOINT = '/api/track';

export type PortfolioInteractionEvent = {
  type: string;
  id: string;
};

let previousEvent: PortfolioInteractionEvent | null = null;

function getValidEvent(event: PortfolioInteractionEvent) {
  const normalizedType = event.type.trim();
  const normalizedId = event.id.trim();

  if (normalizedType.length === 0 || normalizedId.length === 0) {
    return null;
  }

  return {
    type: normalizedType,
    id: normalizedId,
  };
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

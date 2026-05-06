import {
  type GalleryImagePositionBucket,
  normalizePortfolioInteractionEvent,
  type PortfolioInteractionEvent,
} from '../src/lib/analytics';

type TrackPayload = {
  from: PortfolioInteractionEvent;
  to: PortfolioInteractionEvent;
};

type WorkerEnv = {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  DB: {
    prepare(sql: string): {
      bind(...bindings: unknown[]): {
        run(): Promise<unknown>;
      };
    };
  };
};

const API_PATH = '/api/track';
const MAX_TRACK_PAYLOAD_BYTES = 4096;
const textEncoder = new TextEncoder();

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function validateTrackPayload(input: unknown): TrackPayload | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const rawPayload = input as Record<string, unknown>;
  const from = normalizePortfolioInteractionEvent(rawPayload.from);
  const to = normalizePortfolioInteractionEvent(rawPayload.to);

  if (!from || !to) {
    return null;
  }

  return { from, to };
}

function getProjectId(
  from: PortfolioInteractionEvent,
  to: PortfolioInteractionEvent,
) {
  const fromProjectId = from.projectId;
  const toProjectId = to.projectId;

  if (fromProjectId && toProjectId && fromProjectId !== toProjectId) {
    return null;
  }

  return toProjectId ?? fromProjectId;
}

function getImagePositionBucket(
  event: PortfolioInteractionEvent,
): GalleryImagePositionBucket | '' {
  return event.type === 'gallery_image_open' ? event.imagePositionBucket : '';
}

async function handleTrackRequest(request: Request, env: WorkerEnv) {
  if (request.method !== 'POST') {
    return new Response(null, {
      status: 405,
      headers: { allow: 'POST' },
    });
  }

  let payload: TrackPayload | null;

  try {
    const declaredLength = request.headers.get('content-length');
    if (
      declaredLength &&
      Number.isFinite(Number(declaredLength)) &&
      Number(declaredLength) > MAX_TRACK_PAYLOAD_BYTES
    ) {
      return json(413, { error: 'payload_too_large' });
    }

    const rawBody = await request.text();
    if (textEncoder.encode(rawBody).byteLength > MAX_TRACK_PAYLOAD_BYTES) {
      return json(413, { error: 'payload_too_large' });
    }

    payload = validateTrackPayload(JSON.parse(rawBody));
  } catch {
    payload = null;
  }

  if (!payload) {
    return json(400, { error: 'invalid_payload' });
  }

  const projectId = getProjectId(payload.from, payload.to);

  if (!projectId) {
    return json(400, { error: 'invalid_project_scope' });
  }

  const day = new Date().toISOString().slice(0, 10);
  const linkType = payload.to.type === 'external_link_click' ? payload.to.linkType : '';
  const imagePositionBucket = getImagePositionBucket(payload.to);

  await env.DB
    .prepare(
      `INSERT INTO analytics_click_pairs (
         day,
         project_id,
         from_event,
         to_event,
         link_type,
         image_position_bucket,
         count
       )
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT(day, project_id, from_event, to_event, link_type, image_position_bucket)
       DO UPDATE SET count = count + 1`,
    )
    .bind(
      day,
      projectId,
      payload.from.type,
      payload.to.type,
      linkType,
      imagePositionBucket,
    )
    .run();

  return new Response(null, { status: 202 });
}

const worker = {
  async fetch(request: Request, env: WorkerEnv) {
    const url = new URL(request.url);

    if (url.pathname === API_PATH) {
      return handleTrackRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;

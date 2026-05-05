import {
  __resetAnalyticsForTests,
  type PortfolioInteractionEvent,
  trackPortfolioInteraction,
} from '@/lib/analytics';

describe('trackPortfolioInteraction', () => {
  const originalSendBeacon = navigator.sendBeacon;
  const originalFetch = globalThis.fetch;
  const localStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
  const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage');

  let sendBeaconMock: ReturnType<typeof vi.fn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendBeaconMock = vi.fn(() => true);
    fetchMock = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 202 })),
    );

    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeaconMock,
    });
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('localStorage should not be accessed');
      },
    });
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() {
        throw new Error('sessionStorage should not be accessed');
      },
    });

    __resetAnalyticsForTests();
  });

  afterEach(() => {
    __resetAnalyticsForTests();

    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: originalSendBeacon,
    });
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: originalFetch,
    });

    if (localStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', localStorageDescriptor);
    }

    if (sessionStorageDescriptor) {
      Object.defineProperty(window, 'sessionStorage', sessionStorageDescriptor);
    }
  });

  it('buffers the first valid event without sending a network payload', () => {
    trackPortfolioInteraction({ type: 'project_open', projectId: 'project-alpha' });

    expect(sendBeaconMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends one derived pair on the second valid event via sendBeacon', async () => {
    trackPortfolioInteraction({ type: 'project_open', projectId: 'project-alpha' });
    trackPortfolioInteraction({ type: 'filter', tag: 'web' });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();

    const [url, body] = sendBeaconMock.mock.calls[0] as [string, Blob];
    expect(url).toBe('/api/track');
    expect(body).toBeInstanceOf(Blob);
    await expect(body.text()).resolves.toBe(
      JSON.stringify({
        from: { type: 'project_open', projectId: 'project-alpha' },
        to: { type: 'filter', tag: 'web' },
      }),
    );
  });

  it('ignores invalid event sequences without touching storage APIs', () => {
    trackPortfolioInteraction({ type: '', projectId: 'project-alpha' });
    trackPortfolioInteraction({ type: 'project_open', projectId: '   ' });
    trackPortfolioInteraction({ type: 'project_open', projectId: 'project-alpha' });
    trackPortfolioInteraction({ type: ' ', tag: 'filter-web' });
    trackPortfolioInteraction({ type: 'filter', tag: 'web' });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes trimmed fields for explicit event variants', async () => {
    trackPortfolioInteraction({
      type: '  project_open  ',
      projectId: '  project-alpha  ',
    });
    trackPortfolioInteraction({
      type: '  external_link_click  ',
      projectId: '  project-alpha  ',
      linkType: '  repo  ',
    });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);

    const [, body] = sendBeaconMock.mock.calls[0] as [string, Blob];
    await expect(body.text()).resolves.toBe(
      JSON.stringify({
        from: { type: 'project_open', projectId: 'project-alpha' },
        to: {
          type: 'external_link_click',
          projectId: 'project-alpha',
          linkType: 'repo',
        },
      }),
    );
  });

  it('rejects unknown types and mismatched metadata bags', async () => {
    trackPortfolioInteraction({
      type: 'unknown_event',
      projectId: 'project-alpha',
    } as PortfolioInteractionEvent);
    trackPortfolioInteraction({ type: 'project_open', projectId: 'project-alpha' });
    trackPortfolioInteraction({
      type: 'project_open',
      tag: 'web',
    } as PortfolioInteractionEvent);
    trackPortfolioInteraction({ type: 'filter', tag: 'web' });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);

    const [, body] = sendBeaconMock.mock.calls[0] as [string, Blob];
    await expect(body.text()).resolves.toBe(
      JSON.stringify({
        from: { type: 'project_open', projectId: 'project-alpha' },
        to: { type: 'filter', tag: 'web' },
      }),
    );
  });

  it('preserves dedicated link metadata in the derived payload', async () => {
    trackPortfolioInteraction({ type: 'project_open', projectId: 'project-alpha' });
    trackPortfolioInteraction({
      type: 'external_link_click',
      projectId: 'project-alpha',
      linkType: 'repo',
    });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);

    const [, body] = sendBeaconMock.mock.calls[0] as [string, Blob];
    await expect(body.text()).resolves.toBe(
      JSON.stringify({
        from: { type: 'project_open', projectId: 'project-alpha' },
        to: {
          type: 'external_link_click',
          projectId: 'project-alpha',
          linkType: 'repo',
        },
      }),
    );
  });

  it('falls back to fetch when sendBeacon is unavailable', async () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: undefined,
    });

    trackPortfolioInteraction({ type: 'project_open', projectId: 'project-alpha' });
    await trackPortfolioInteraction({ type: 'filter', tag: 'web' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sendBeaconMock).not.toHaveBeenCalled();

    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit | undefined,
    ];
    expect(url).toBe('/api/track');
    expect(init?.method).toBe('POST');
    expect(init?.keepalive).toBe(true);
    expect(init?.headers).toEqual({ 'content-type': 'application/json' });
    expect(init?.body).toBe(
      JSON.stringify({
        from: { type: 'project_open', projectId: 'project-alpha' },
        to: { type: 'filter', tag: 'web' },
      }),
    );
  });

  it('falls back to fetch when sendBeacon returns false', async () => {
    sendBeaconMock.mockReturnValue(false);

    trackPortfolioInteraction({ type: 'project_open', projectId: 'project-alpha' });
    await trackPortfolioInteraction({ type: 'filter', tag: 'web' });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit | undefined,
    ];
    expect(url).toBe('/api/track');
    expect(init?.method).toBe('POST');
    expect(init?.keepalive).toBe(true);
    expect(init?.headers).toEqual({ 'content-type': 'application/json' });
    expect(init?.body).toBe(
      JSON.stringify({
        from: { type: 'project_open', projectId: 'project-alpha' },
        to: { type: 'filter', tag: 'web' },
      }),
    );
  });
});

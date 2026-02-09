import { useEffect, useRef, useState } from 'react';

let mermaidPromise: Promise<typeof import('mermaid')> | null = null;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => {
      mod.default.initialize({
        startOnLoad: false,
        theme: 'neutral',
        fontFamily: 'ui-monospace, monospace',
      });
      return mod;
    });
  }
  return mermaidPromise;
}

let diagramId = 0;

export function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${++diagramId}`;

    loadMermaid()
      .then(async (mod) => {
        if (cancelled || !containerRef.current) return;
        const { svg } = await mod.default.render(id, chart.trim());
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? 'Failed to render diagram');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <pre className="bg-neutral-900 text-neutral-100 border border-neutral-800 p-4 text-sm overflow-x-auto">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div className="not-prose relative my-6">
      {loading && (
        <div className="flex items-center justify-center border border-neutral-200 rounded bg-neutral-50 p-12">
          <div className="flex items-center gap-3 text-sm text-neutral-500 font-mono">
            <div className="h-4 w-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            Loading diagram...
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={`flex justify-center ${loading ? 'hidden' : ''}`}
      />
    </div>
  );
}

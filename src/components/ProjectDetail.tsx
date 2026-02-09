import {
  ArrowLeft,
  ExternalLink,
  Github,
  BookOpen,
  Play,
  FileText,
  Video,
  Building2,
} from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { MermaidDiagram } from '@/components/MermaidDiagram';
import projectsData from '@/_portfolio/projects.json';
import type { Project } from '@/types';

const projects = projectsData as Project[];

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

const statusColors: Record<Project['status'], string> = {
  live: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  wip: 'bg-blue-100 text-blue-800 border-blue-200',
  experimental: 'bg-amber-100 text-amber-800 border-amber-200',
  archived: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

const linkMeta: Record<string, { icon: typeof ExternalLink; label: string }> = {
  live: { icon: ExternalLink, label: 'View live' },
  repo: { icon: Github, label: 'Source code' },
  docs: { icon: BookOpen, label: 'Documentation' },
  demo: { icon: Play, label: 'Demo' },
  post: { icon: FileText, label: 'Blog post' },
  video: { icon: Video, label: 'Video' },
};

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Project not found</p>
          <button
            onClick={onBack}
            className="text-neutral-900 hover:text-neutral-700 font-mono text-sm"
          >
            ← Return to projects
          </button>
        </div>
      </div>
    );
  }

  const presentLinks = project.links
    ? Object.entries(project.links).filter(([, url]) => url != null)
    : [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors font-mono mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All projects
          </button>

          <div className="flex items-start justify-between gap-6 mb-4">
            <h1 className="text-3xl font-medium text-neutral-900">
              {project.title}
            </h1>
            <span
              className={`px-3 py-1 text-sm border rounded font-mono shrink-0 ${statusColors[project.status]}`}
            >
              {project.status}
            </span>
          </div>

          <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
            {project.tagline}
          </p>

          {project.timeframe && (
            <p className="text-sm text-neutral-500 font-mono mb-4">
              {project.timeframe.start}
              {' → '}
              {project.timeframe.end ?? 'present'}
            </p>
          )}

          {presentLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {presentLinks.map(([key, url]) => {
                const meta = linkMeta[key];
                if (!meta || !url) return null;
                const Icon = meta.icon;
                const isPrimary = key === 'live';
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded font-mono transition-colors ${
                      isPrimary
                        ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                        : 'border border-neutral-300 text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {meta.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr,280px] gap-12">
          <main className="bg-white border border-neutral-200 p-8">
            <article
              className="prose prose-neutral max-w-none
                prose-headings:font-medium
                prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                prose-p:text-neutral-700 prose-p:leading-relaxed
                prose-code:text-sm prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-pre:border prose-pre:border-neutral-800
                prose-ul:text-neutral-700
                prose-strong:text-neutral-900 prose-strong:font-medium"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code({ className, children, ...rest }: ComponentPropsWithoutRef<'code'>) {
                    if (className === 'language-mermaid') {
                      return <MermaidDiagram chart={String(children)} />;
                    }
                    return <code className={className} {...rest}>{children}</code>;
                  },
                  pre({ children }) {
                    return <>{children}</>;
                  },
                }}
              >
                {project.markdown}
              </ReactMarkdown>
            </article>
          </main>

          <aside>
            <div className="sticky top-6 space-y-6">
              {project.attribution && (
                <div className="bg-amber-50 border border-amber-200 p-5">
                  <h3 className="text-xs font-medium text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" />
                    Professional Work
                  </h3>
                  {project.attribution.ownership && (
                    <p className="text-sm text-amber-900 mb-2">
                      {project.attribution.ownership}
                    </p>
                  )}
                  {project.attribution.my_role && (
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {project.attribution.my_role}
                    </p>
                  )}
                  {project.attribution.context && (
                    <p className="text-xs text-amber-700 mt-2 leading-relaxed">
                      {project.attribution.context}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-white border border-neutral-200 p-5">
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-neutral-200 p-5">
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                  Tech Stack
                </h3>
                <ul className="space-y-1.5">
                  {project.stack.map((tech) => (
                    <li
                      key={tech}
                      className="text-sm text-neutral-700 font-mono"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>

              {project.metrics && (
                <div className="bg-white border border-neutral-200 p-5">
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
                    Metrics
                  </h3>
                  <dl className="space-y-2">
                    {project.metrics.users != null && (
                      <div>
                        <dt className="text-xs text-neutral-500">Users</dt>
                        <dd className="text-sm font-mono text-neutral-800">
                          {project.metrics.users.toLocaleString()}
                        </dd>
                      </div>
                    )}
                    {project.metrics.requests_per_day != null && (
                      <div>
                        <dt className="text-xs text-neutral-500">
                          Requests/day
                        </dt>
                        <dd className="text-sm font-mono text-neutral-800">
                          {project.metrics.requests_per_day.toLocaleString()}
                        </dd>
                      </div>
                    )}
                    {project.metrics.latency_ms_p95 != null && (
                      <div>
                        <dt className="text-xs text-neutral-500">
                          P95 Latency
                        </dt>
                        <dd className="text-sm font-mono text-neutral-800">
                          {project.metrics.latency_ms_p95}ms
                        </dd>
                      </div>
                    )}
                    {project.metrics.uptime != null && (
                      <div>
                        <dt className="text-xs text-neutral-500">Uptime</dt>
                        <dd className="text-sm font-mono text-neutral-800">
                          {project.metrics.uptime}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

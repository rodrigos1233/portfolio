import {
  ArrowLeft,
  ExternalLink,
  Github,
  BookOpen,
  Play,
  FileText,
  Video,
} from 'lucide-react';
import type { Project } from '@/types';

interface ProjectDetailHeaderProps {
  project: Project;
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

export function ProjectDetailHeader({ project, onBack }: ProjectDetailHeaderProps) {
  const presentLinks = project.links
    ? Object.entries(project.links).filter(([, url]) => url != null)
    : [];

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors font-mono mb-6 cursor-pointer"
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

        {project.media?.cover_image && (
          <div className="mt-6 overflow-hidden border border-neutral-200">
            <img
              src={project.media.cover_image}
              alt={`${project.title} cover`}
              className="w-full"
            />
          </div>
        )}
      </div>
    </header>
  );
}

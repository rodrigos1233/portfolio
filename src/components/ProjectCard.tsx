import {
  ExternalLink,
  Github,
  BookOpen,
  Play,
  FileText,
  Video,
} from 'lucide-react';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onSelect: (id: string) => void;
}

const statusColors: Record<Project['status'], string> = {
  live: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  wip: 'bg-blue-100 text-blue-800 border-blue-200',
  experimental: 'bg-amber-100 text-amber-800 border-amber-200',
  archived: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

const linkIcons: Record<string, typeof ExternalLink> = {
  live: ExternalLink,
  repo: Github,
  docs: BookOpen,
  demo: Play,
  post: FileText,
  video: Video,
};

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  const presentLinks = project.links
    ? Object.entries(project.links).filter(
        ([, url]) => url != null,
      )
    : [];

  return (
    <button
      onClick={() => onSelect(project.id)}
      className="block group w-full text-left cursor-pointer"
    >
      <div className="border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-400 hover:shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors">
            {project.title}
          </h3>
          <span
            className={`px-2 py-0.5 text-xs border rounded font-mono shrink-0 ${statusColors[project.status]}`}
          >
            {project.status}
          </span>
        </div>

        <p className="text-neutral-600 text-sm mb-4 leading-relaxed">
          {project.tagline}
        </p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs rounded font-mono"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {presentLinks.map(([key]) => {
              const Icon = linkIcons[key] ?? ExternalLink;
              return (
                <Icon key={key} className="w-4 h-4 text-neutral-400" />
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-100 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-wrap gap-1.5">
            {project.stack.slice(0, 5).map((tech) => (
              <span key={tech} className="text-xs text-neutral-500 font-mono">
                {tech}
              </span>
            ))}
            {project.stack.length > 5 && (
              <span className="text-xs text-neutral-400 font-mono">
                +{project.stack.length - 5}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

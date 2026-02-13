import { ProjectDetailHeader } from '@/components/ProjectDetailHeader';
import { ProjectMarkdown } from '@/components/ProjectMarkdown';
import { ProjectGallery } from '@/components/ProjectGallery';
import { ProjectSidebar } from '@/components/ProjectSidebar';
import projectsData from '@/_portfolio/projects.json';
import type { Project } from '@/types';

const projects = projectsData as Project[];

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Project not found</p>
          <button
            onClick={onBack}
            className="text-neutral-900 hover:text-neutral-700 font-mono text-sm cursor-pointer"
          >
            ← Return to projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <ProjectDetailHeader project={project} onBack={onBack} />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr,280px] gap-12">
          <main className="bg-white border border-neutral-200 p-8">
            <ProjectMarkdown markdown={project.markdown} />
            <ProjectGallery
              images={project.media?.gallery ?? []}
              alt={project.title}
            />
          </main>

          <ProjectSidebar project={project} />
        </div>
      </div>
    </div>
  );
}

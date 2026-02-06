import { useState, useMemo } from 'react';
import { ProjectCard } from './ProjectCard';
import { FilterBar } from './FilterBar';
import projectsData from '@/_portfolio/projects.json';
import type { Project } from '@/types';

const projects = projectsData as Project[];

interface ProjectListProps {
  onSelectProject: (id: string) => void;
}

function sortProjects(items: Project[]): Project[] {
  return [...items].sort((a, b) => {
    // Featured first
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    // Most recent start date
    const aStart = a.timeframe?.start ?? '';
    const bStart = b.timeframe?.start ?? '';
    if (aStart !== bStart) return bStart.localeCompare(aStart);
    // Alphabetical fallback
    return a.title.localeCompare(b.title);
  });
}

export function ProjectList({ onSelectProject }: ProjectListProps) {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach((project) => {
      project.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, []);

  const filteredProjects = useMemo(() => {
    const filtered =
      selectedTags.size === 0
        ? projects
        : projects.filter((project) =>
            Array.from(selectedTags).every((tag) =>
              project.tags.includes(tag),
            ),
          );
    return sortProjects(filtered);
  }, [selectedTags]);

  const handleToggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-medium text-neutral-900 mb-2">
            Projects
          </h1>
          <p className="text-neutral-600 max-w-2xl leading-relaxed">
            A catalog of systems, tools, and experiments. Each project represents
            an attempt to solve a specific problem or explore a technical idea.
          </p>
        </div>
      </header>

      <FilterBar
        availableTags={availableTags}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
        projectCount={filteredProjects.length}
        totalCount={projects.length}
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onSelectProject}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500 font-mono text-sm">
              No projects match the selected filters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

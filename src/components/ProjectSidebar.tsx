import { Building2 } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectSidebarProps {
  project: Project;
}

export function ProjectSidebar({ project }: ProjectSidebarProps) {
  return (
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
  );
}

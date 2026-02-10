import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Project } from '@/types';
import { ProjectCard } from '@/components/ProjectCard';
import { FilterBar } from '@/components/FilterBar';

const mockProjects: Project[] = [
  {
    id: 'project-alpha',
    title: 'Project Alpha',
    tagline: 'First test project',
    status: 'live',
    visibility: 'public',
    tags: ['web', 'api'],
    stack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
    markdown: '# Alpha',
    featured: true,
    timeframe: { start: '2024-01' },
    links: { repo: 'https://github.com/test/alpha', live: 'https://alpha.example.com' },
  },
  {
    id: 'project-beta',
    title: 'Project Beta',
    tagline: 'Second test project',
    status: 'archived',
    visibility: 'public',
    tags: ['cli', 'api'],
    stack: ['Python'],
    markdown: '# Beta',
    featured: false,
    timeframe: { start: '2023-06', end: '2023-12' },
  },
  {
    id: 'project-gamma',
    title: 'Project Gamma',
    tagline: 'Third test project',
    status: 'experimental',
    visibility: 'public',
    tags: ['web'],
    stack: ['Rust'],
    markdown: '# Gamma',
    featured: false,
    timeframe: { start: '2024-06' },
  },
];

// Mock the static JSON import used by ProjectList and ProjectDetail
vi.mock('@/_portfolio/projects.json', () => ({
  default: mockProjects,
}));

// Mock mermaid to avoid heavy async loading
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>mock</svg>' }),
  },
}));

describe('ProjectCard', () => {
  const project = mockProjects[0];

  it('renders title, tagline, and status', () => {
    render(<ProjectCard project={project} onSelect={vi.fn()} />);

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('First test project')).toBeInTheDocument();
    expect(screen.getByText('live')).toBeInTheDocument();
  });

  it('renders all tags', () => {
    render(<ProjectCard project={project} onSelect={vi.fn()} />);

    expect(screen.getByText('web')).toBeInTheDocument();
    expect(screen.getByText('api')).toBeInTheDocument();
  });

  it('calls onSelect with project id when clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<ProjectCard project={project} onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith('project-alpha');
  });

  it('shows +N when stack has more than 5 items', () => {
    render(<ProjectCard project={project} onSelect={vi.fn()} />);

    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('does not show +N when stack has 5 or fewer items', () => {
    render(<ProjectCard project={mockProjects[1]} onSelect={vi.fn()} />);

    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });
});

describe('FilterBar', () => {
  const tags = ['api', 'cli', 'web'];

  it('renders all available tags', () => {
    render(
      <FilterBar
        availableTags={tags}
        selectedTags={new Set()}
        onToggleTag={vi.fn()}
        projectCount={3}
        totalCount={3}
      />,
    );

    for (const tag of tags) {
      expect(screen.getByText(tag)).toBeInTheDocument();
    }
  });

  it('shows total count when no filters applied', () => {
    render(
      <FilterBar
        availableTags={tags}
        selectedTags={new Set()}
        onToggleTag={vi.fn()}
        projectCount={3}
        totalCount={3}
      />,
    );

    expect(screen.getByText('3 projects')).toBeInTheDocument();
  });

  it('shows filtered count when filters applied', () => {
    render(
      <FilterBar
        availableTags={tags}
        selectedTags={new Set(['web'])}
        onToggleTag={vi.fn()}
        projectCount={2}
        totalCount={3}
      />,
    );

    expect(screen.getByText('2 of 3 projects')).toBeInTheDocument();
  });

  it('calls onToggleTag when a tag is clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(
      <FilterBar
        availableTags={tags}
        selectedTags={new Set()}
        onToggleTag={onToggle}
        projectCount={3}
        totalCount={3}
      />,
    );

    await user.click(screen.getByText('web'));
    expect(onToggle).toHaveBeenCalledWith('web');
  });

  it('shows clear button only when tags are selected', () => {
    const { rerender } = render(
      <FilterBar
        availableTags={tags}
        selectedTags={new Set()}
        onToggleTag={vi.fn()}
        projectCount={3}
        totalCount={3}
      />,
    );

    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();

    rerender(
      <FilterBar
        availableTags={tags}
        selectedTags={new Set(['web'])}
        onToggleTag={vi.fn()}
        projectCount={2}
        totalCount={3}
      />,
    );

    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });
});

describe('ProjectList', () => {
  // Lazy import so the vi.mock above takes effect
  let ProjectList: typeof import('@/components/ProjectList').ProjectList;

  beforeAll(async () => {
    const mod = await import('@/components/ProjectList');
    ProjectList = mod.ProjectList;
  });

  it('renders all project cards', () => {
    render(<ProjectList onSelectProject={vi.fn()} />);

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
    expect(screen.getByText('Project Gamma')).toBeInTheDocument();
  });

  it('shows total project count', () => {
    render(<ProjectList onSelectProject={vi.fn()} />);

    expect(screen.getByText('3 projects')).toBeInTheDocument();
  });

  it('sorts featured projects first', () => {
    render(<ProjectList onSelectProject={vi.fn()} />);

    const buttons = screen.getAllByRole('button').filter((b) =>
      b.classList.contains('block'),
    );
    // First card should be the featured project (Alpha)
    expect(buttons[0]).toHaveTextContent('Project Alpha');
  });

  it('filters projects by tag', async () => {
    const user = userEvent.setup();
    render(<ProjectList onSelectProject={vi.fn()} />);

    // Click the filter button (not the tag span inside a card)
    await user.click(screen.getByRole('button', { name: 'cli' }));

    expect(screen.getByText('Project Beta')).toBeInTheDocument();
    expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
    expect(screen.queryByText('Project Gamma')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 3 projects')).toBeInTheDocument();
  });

  it('shows empty state when no projects match', async () => {
    const user = userEvent.setup();
    render(<ProjectList onSelectProject={vi.fn()} />);

    // Select both 'cli' and 'web' via filter buttons — no project has both
    await user.click(screen.getByRole('button', { name: 'cli' }));
    await user.click(screen.getByRole('button', { name: 'web' }));

    expect(screen.getByText('No projects match the selected filters.')).toBeInTheDocument();
  });
});

describe('ProjectDetail', () => {
  let ProjectDetail: typeof import('@/components/ProjectDetail').ProjectDetail;

  beforeAll(async () => {
    const mod = await import('@/components/ProjectDetail');
    ProjectDetail = mod.ProjectDetail;
  });

  it('renders project content for valid id', () => {
    render(<ProjectDetail projectId="project-alpha" onBack={vi.fn()} />);

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('First test project')).toBeInTheDocument();
    expect(screen.getByText('live')).toBeInTheDocument();
  });

  it('shows not found for invalid id', () => {
    render(<ProjectDetail projectId="does-not-exist" onBack={vi.fn()} />);

    expect(screen.getByText('Project not found')).toBeInTheDocument();
  });

  it('calls onBack when return button is clicked', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(<ProjectDetail projectId="does-not-exist" onBack={onBack} />);
    await user.click(screen.getByText(/Return to projects/));

    expect(onBack).toHaveBeenCalled();
  });

  it('renders tags in sidebar', () => {
    render(<ProjectDetail projectId="project-alpha" onBack={vi.fn()} />);

    expect(screen.getByText('Tags')).toBeInTheDocument();
    // Tags appear in both header context and sidebar, just confirm they exist
    const webElements = screen.getAllByText('web');
    expect(webElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders tech stack in sidebar', () => {
    render(<ProjectDetail projectId="project-alpha" onBack={vi.fn()} />);

    expect(screen.getByText('Tech Stack')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('renders timeframe', () => {
    render(<ProjectDetail projectId="project-alpha" onBack={vi.fn()} />);

    expect(screen.getByText(/2024-01/)).toBeInTheDocument();
    expect(screen.getByText(/present/)).toBeInTheDocument();
  });
});

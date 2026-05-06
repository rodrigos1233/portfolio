import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Project } from '@/types';
import { trackPortfolioInteraction } from '@/lib/analytics';
import { ProjectCard } from '@/components/ProjectCard';
import { FilterBar } from '@/components/FilterBar';
import { ProjectGallery } from '@/components/ProjectGallery';

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
    media: {
      gallery: [
        '/alpha-1.png',
        '/alpha-2.png',
        '/alpha-3.png',
        '/alpha-4.png',
        '/alpha-5.png',
      ],
    },
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

vi.mock('@/lib/analytics', () => ({
  trackPortfolioInteraction: vi.fn(),
}));

describe('ProjectCard', () => {
  const project = mockProjects[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'project_open',
      projectId: 'project-alpha',
    });
    expect(trackPortfolioInteraction).toHaveBeenCalledTimes(1);
  });

  it('still calls onSelect when analytics throws synchronously', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    vi.mocked(trackPortfolioInteraction).mockImplementation(() => {
      throw new Error('analytics failed');
    });

    render(<ProjectCard project={project} onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith('project-alpha');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'project_open',
      projectId: 'project-alpha',
    });
    expect(trackPortfolioInteraction).toHaveBeenCalledTimes(1);
  });

  it('still calls onSelect when analytics rejects asynchronously', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    vi.mocked(trackPortfolioInteraction).mockRejectedValueOnce(
      new Error('analytics failed'),
    );

    render(<ProjectCard project={project} onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));
    await Promise.resolve();

    expect(onSelect).toHaveBeenCalledWith('project-alpha');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'project_open',
      projectId: 'project-alpha',
    });
    expect(trackPortfolioInteraction).toHaveBeenCalledTimes(1);
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

describe('ProjectGallery', () => {
  const galleryImages = [
    '/alpha-1.png',
    '/alpha-2.png',
    '/alpha-3.png',
    '/alpha-4.png',
    '/alpha-5.png',
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records gallery_expand only when opening the overflow section', async () => {
    const user = userEvent.setup();

    render(
      <ProjectGallery
        projectId="project-alpha"
        images={galleryImages}
        alt="Project Alpha"
      />,
    );

    await user.click(screen.getByRole('button', { name: '+1 more' }));

    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'gallery_expand',
      projectId: 'project-alpha',
    });
    expect(trackPortfolioInteraction).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Show less' }));

    expect(trackPortfolioInteraction).toHaveBeenCalledTimes(1);
  });

  it('still expands when analytics rejects asynchronously', async () => {
    const user = userEvent.setup();

    vi.mocked(trackPortfolioInteraction).mockRejectedValueOnce(
      new Error('analytics failed'),
    );

    render(
      <ProjectGallery
        projectId="project-alpha"
        images={galleryImages}
        alt="Project Alpha"
      />,
    );

    await user.click(screen.getByRole('button', { name: '+1 more' }));
    await Promise.resolve();

    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'gallery_expand',
      projectId: 'project-alpha',
    });
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('records gallery_image_open with a bucketed position and preserves modal behavior', async () => {
    const user = userEvent.setup();

    render(
      <ProjectGallery
        projectId="project-alpha"
        images={galleryImages}
        alt="Project Alpha"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Project Alpha screenshot 2' }));

    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'gallery_image_open',
      projectId: 'project-alpha',
      imagePositionBucket: '2-4',
    });
    expect(trackPortfolioInteraction).toHaveBeenCalledTimes(1);
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('still opens the modal when analytics throws synchronously', async () => {
    const user = userEvent.setup();

    vi.mocked(trackPortfolioInteraction).mockImplementationOnce(() => {
      throw new Error('analytics failed');
    });

    render(
      <ProjectGallery
        projectId="project-alpha"
        images={galleryImages}
        alt="Project Alpha"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Project Alpha screenshot 1' }));

    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'gallery_image_open',
      projectId: 'project-alpha',
      imagePositionBucket: '1',
    });
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('uses a 5+ bucket instead of raw image names for later gallery images', async () => {
    const user = userEvent.setup();

    render(
      <ProjectGallery
        projectId="project-alpha"
        images={galleryImages}
        alt="Project Alpha"
      />,
    );

    await user.click(screen.getByRole('button', { name: '+1 more' }));
    await user.click(screen.getByRole('button', { name: 'Project Alpha screenshot 5' }));

    expect(trackPortfolioInteraction).toHaveBeenLastCalledWith({
      type: 'gallery_image_open',
      projectId: 'project-alpha',
      imagePositionBucket: '5+',
    });
    expect(trackPortfolioInteraction).not.toHaveBeenCalledWith(
      expect.objectContaining({
        imageName: '/alpha-5.png',
      }),
    );
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('records back_to_list when clicking All projects', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(<ProjectDetail projectId="project-alpha" onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: 'All projects' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'back_to_list',
      projectId: 'project-alpha',
    });
  });

  it('still calls onBack when analytics rejects asynchronously', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();

    vi.mocked(trackPortfolioInteraction).mockRejectedValueOnce(
      new Error('analytics failed'),
    );

    render(<ProjectDetail projectId="project-alpha" onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: 'All projects' }));
    await Promise.resolve();

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'back_to_list',
      projectId: 'project-alpha',
    });
  });

  it('still calls onBack when analytics throws synchronously', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();

    vi.mocked(trackPortfolioInteraction).mockImplementationOnce(() => {
      throw new Error('analytics failed');
    });

    render(<ProjectDetail projectId="project-alpha" onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: 'All projects' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'back_to_list',
      projectId: 'project-alpha',
    });
  });

  it('records external_link_click with the expected link type', async () => {
    render(<ProjectDetail projectId="project-alpha" onBack={vi.fn()} />);

    const liveLink = screen.getByRole('link', { name: 'View live' });
    liveLink.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(liveLink);
    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'external_link_click',
      projectId: 'project-alpha',
      linkType: 'live',
    });

    const sourceLink = screen.getByRole('link', { name: 'Source code' });
    sourceLink.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(sourceLink);
    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'external_link_click',
      projectId: 'project-alpha',
      linkType: 'repo',
    });
  });

  it('passes projectId into gallery analytics and preserves the first-image bucket', async () => {
    const user = userEvent.setup();

    render(<ProjectDetail projectId="project-alpha" onBack={vi.fn()} />);

    await user.click(
      screen.getByRole('button', { name: 'Project Alpha screenshot 1' }),
    );

    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'gallery_image_open',
      projectId: 'project-alpha',
      imagePositionBucket: '1',
    });
  });

  it('does not block external link clicks when analytics rejects asynchronously', async () => {
    vi.mocked(trackPortfolioInteraction).mockRejectedValueOnce(
      new Error('analytics failed'),
    );

    render(<ProjectDetail projectId="project-alpha" onBack={vi.fn()} />);

    const liveLink = screen.getByRole('link', { name: 'View live' });
    liveLink.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(liveLink);
    await Promise.resolve();

    expect(liveLink).toHaveAttribute('href', 'https://alpha.example.com');
    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'external_link_click',
      projectId: 'project-alpha',
      linkType: 'live',
    });
  });

  it('does not block external link clicks when analytics throws synchronously', () => {
    vi.mocked(trackPortfolioInteraction).mockImplementationOnce(() => {
      throw new Error('analytics failed');
    });

    render(<ProjectDetail projectId="project-alpha" onBack={vi.fn()} />);

    const liveLink = screen.getByRole('link', { name: 'View live' });
    liveLink.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(liveLink);

    expect(liveLink).toHaveAttribute('href', 'https://alpha.example.com');
    expect(trackPortfolioInteraction).toHaveBeenCalledWith({
      type: 'external_link_click',
      projectId: 'project-alpha',
      linkType: 'live',
    });
  });
});

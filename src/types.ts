export interface Project {
  id: string;
  title: string;
  tagline: string;
  markdown: string;

  status: 'live' | 'wip' | 'experimental' | 'archived';
  visibility: 'private' | 'public';
  tags: string[];
  stack: string[];

  role?: 'solo' | 'team' | 'client';
  timeframe?: {
    start: string;
    end?: string | null;
  };
  featured?: boolean;

  metrics?: {
    users?: number | null;
    requests_per_day?: number | null;
    latency_ms_p95?: number | null;
    uptime?: string | null;
    notes?: string | null;
  };

  links?: {
    live?: string | null;
    repo?: string | null;
    docs?: string | null;
    demo?: string | null;
    post?: string | null;
    video?: string | null;
  };

  media?: {
    cover_image?: string | null;
    gallery?: string[];
  };

  origin?: 'personal' | 'professional';
  attribution?: {
    ownership?: string;
    context?: string;
    my_role?: string;
    team_size?: number;
    permissions?: {
      code_public?: boolean;
      screenshots_public?: boolean;
      discussion_level?: string;
    };
  };

  toc?: boolean;
}

export type ProjectTag = string;

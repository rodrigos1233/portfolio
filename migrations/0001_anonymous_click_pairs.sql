CREATE TABLE analytics_click_pairs (
  day TEXT NOT NULL,
  project_id TEXT NOT NULL,
  from_event TEXT NOT NULL,
  to_event TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (day, project_id, from_event, to_event, link_type)
);

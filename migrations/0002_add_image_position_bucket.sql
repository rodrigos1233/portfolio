ALTER TABLE analytics_click_pairs RENAME TO analytics_click_pairs_old;

CREATE TABLE analytics_click_pairs (
  day TEXT NOT NULL,
  project_id TEXT NOT NULL,
  from_event TEXT NOT NULL,
  to_event TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT '',
  image_position_bucket TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (day, project_id, from_event, to_event, link_type, image_position_bucket)
);

INSERT INTO analytics_click_pairs (
  day,
  project_id,
  from_event,
  to_event,
  link_type,
  image_position_bucket,
  count
)
SELECT
  day,
  project_id,
  from_event,
  to_event,
  link_type,
  '',
  count
FROM analytics_click_pairs_old;

DROP TABLE analytics_click_pairs_old;

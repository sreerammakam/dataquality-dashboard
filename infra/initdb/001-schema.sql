-- Core tables for Data Quality Dashboard

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS datasets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL CHECK (department IN ('Sales','Marketing','Billing','Ordering','Results')),
  description TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('Completeness','Accuracy','Consistency','Timeliness')),
  threshold NUMERIC(5,2) NOT NULL CHECK (threshold >= 0 AND threshold <= 100),
  dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_quality_metrics (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  overall_score NUMERIC(5,2),
  completeness NUMERIC(5,2),
  accuracy NUMERIC(5,2),
  consistency NUMERIC(5,2),
  timeliness NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dataset_id, metric_date)
);

CREATE TABLE IF NOT EXISTS data_quality_issues (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  rule_id INTEGER REFERENCES quality_rules(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  title TEXT NOT NULL,
  details TEXT,
  sample_records JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relations
CREATE TABLE IF NOT EXISTS user_dataset (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','editor','viewer')),
  PRIMARY KEY(user_id, dataset_id)
);

CREATE TABLE IF NOT EXISTS metric_issue_link (
  metric_id INTEGER REFERENCES data_quality_metrics(id) ON DELETE CASCADE,
  issue_id INTEGER REFERENCES data_quality_issues(id) ON DELETE CASCADE,
  PRIMARY KEY(metric_id, issue_id)
);

-- Views to simplify API consumption
CREATE OR REPLACE VIEW v_metric_latest AS
SELECT DISTINCT ON (dataset_id)
  dataset_id,
  metric_date,
  overall_score, completeness, accuracy, consistency, timeliness
FROM data_quality_metrics
ORDER BY dataset_id, metric_date DESC;

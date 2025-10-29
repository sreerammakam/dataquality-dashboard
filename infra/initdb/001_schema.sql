-- Canonical schema for Data Quality Dashboard

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Datasets
CREATE TABLE IF NOT EXISTS datasets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL CHECK (department IN ('Sales','Marketing','Billing','Ordering','Results')),
  description TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quality Rules
CREATE TABLE IF NOT EXISTS quality_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('Completeness','Accuracy','Consistency','Timeliness')),
  threshold NUMERIC(5,2) NOT NULL CHECK (threshold >= 0 AND threshold <= 100),
  severity TEXT CHECK (severity IN ('low','medium','high')) DEFAULT 'medium',
  dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
  rule_expression TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data Quality Metrics
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

-- Data Quality Issues
CREATE TABLE IF NOT EXISTS data_quality_issues (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  rule_id INTEGER REFERENCES quality_rules(id) ON DELETE SET NULL,
  metric_id INTEGER REFERENCES data_quality_metrics(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status TEXT CHECK (status IN ('open','in_progress','resolved')) DEFAULT 'open',
  title TEXT NOT NULL,
  description TEXT,
  details TEXT,
  affected_count INT DEFAULT 0,
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
  id AS metric_id,
  dataset_id,
  metric_date,
  overall_score, completeness, accuracy, consistency, timeliness
FROM data_quality_metrics
ORDER BY dataset_id, metric_date DESC;

-- Relationships helper view
CREATE OR REPLACE VIEW schema_overview AS
SELECT 
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY';
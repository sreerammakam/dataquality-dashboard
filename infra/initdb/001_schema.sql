-- Core tables
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS datasets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  owner_user_id INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quality_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  dataset_id INT REFERENCES datasets(id) ON DELETE CASCADE,
  rule_expression TEXT NOT NULL,
  threshold NUMERIC(5,2) NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_quality_metrics (
  id SERIAL PRIMARY KEY,
  dataset_id INT REFERENCES datasets(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  overall_score NUMERIC(5,2),
  completeness NUMERIC(5,2),
  accuracy NUMERIC(5,2),
  consistency NUMERIC(5,2),
  timeliness NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dataset_id, metric_date)
);

CREATE TABLE IF NOT EXISTS data_quality_issues (
  id SERIAL PRIMARY KEY,
  dataset_id INT REFERENCES datasets(id) ON DELETE CASCADE,
  rule_id INT REFERENCES quality_rules(id) ON DELETE SET NULL,
  metric_id INT REFERENCES data_quality_metrics(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved')) DEFAULT 'open',
  affected_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_dataset_roles (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  dataset_id INT REFERENCES datasets(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('viewer', 'editor', 'owner')) NOT NULL,
  PRIMARY KEY (user_id, dataset_id)
);

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
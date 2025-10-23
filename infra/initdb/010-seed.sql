INSERT INTO users (email, display_name) VALUES
  ('admin@example.com', 'Admin User')
ON CONFLICT DO NOTHING;

INSERT INTO datasets (name, department, description, created_by) VALUES
  ('Customers', 'Sales', 'Customer master records', 1),
  ('Orders', 'Ordering', 'Order transactions', 1),
  ('MarketingContacts', 'Marketing', 'Leads and contacts', 1),
  ('Inventory', 'Billing', 'Inventory and billing linkage', 1),
  ('Results', 'Results', 'Experiment results data', 1)
ON CONFLICT DO NOTHING;

-- Seed a few rules
INSERT INTO quality_rules (name, description, metric_type, threshold, dataset_id) VALUES
  ('Customer Email Completeness', 'Emails should be present', 'Completeness', 95.0, 1),
  ('Order Timeliness', 'Orders processed within 24h', 'Timeliness', 90.0, 2),
  ('Contact Phone Accuracy', 'Phone numbers valid', 'Accuracy', 92.0, 3)
ON CONFLICT DO NOTHING;

-- Seed some metrics over the last few days
WITH d AS (
  SELECT id AS dataset_id FROM datasets
), days AS (
  SELECT CURRENT_DATE - offs AS metric_date FROM generate_series(0, 14) AS offs
)
INSERT INTO data_quality_metrics (dataset_id, metric_date, overall_score, completeness, accuracy, consistency, timeliness)
SELECT d.dataset_id, days.metric_date,
       80 + (random()*20)::int,
       80 + (random()*20)::int,
       80 + (random()*20)::int,
       80 + (random()*20)::int,
       80 + (random()*20)::int
FROM d CROSS JOIN days
ON CONFLICT DO NOTHING;

-- Seed a few issues
INSERT INTO data_quality_issues (dataset_id, rule_id, issue_date, severity, title, details)
VALUES
  (1, 1, CURRENT_DATE - 1, 'high', 'Missing customer emails', 'Detected 5% records without email'),
  (3, 3, CURRENT_DATE - 2, 'medium', 'Invalid phone numbers', 'Detected invalid area codes'),
  (2, 2, CURRENT_DATE - 3, 'critical', 'Delayed order processing', 'SLAs breached for 15% orders')
ON CONFLICT DO NOTHING;

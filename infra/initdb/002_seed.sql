INSERT INTO users (email, name) VALUES
  ('alice@example.com','Alice'),
  ('bob@example.com','Bob')
ON CONFLICT DO NOTHING;

INSERT INTO datasets (name, department, description, owner_user_id) VALUES
  ('Customers','Sales','Master customer records', 1),
  ('Leads','Marketing','Inbound marketing leads', 2),
  ('Orders','Ordering','Customer order headers', 1),
  ('Billing','Billing','Invoices and payments', 2)
ON CONFLICT DO NOTHING;

INSERT INTO quality_rules (name, description, dataset_id, rule_expression, threshold, severity) VALUES
  ('Valid phone numbers','Phone must match regex', 1, 'phone ~ \'^\\+?[0-9]{10,15}$\'', 95.0, 'high'),
  ('No duplicate customer records','Unique on email', 1, 'count(distinct email) / count(*)', 99.0, 'high'),
  ('Missing email check','Email not null', 1, 'email IS NOT NULL', 98.0, 'medium'),
  ('Fresh leads','Lead age < 30 days', 2, 'now() - created_at < interval \'30 days\'', 90.0, 'medium');

-- Sample metrics over a few days
INSERT INTO data_quality_metrics (dataset_id, metric_date, overall_score, completeness, accuracy, consistency, timeliness) VALUES
  (1, CURRENT_DATE - INTERVAL '4 days', 92.5, 95.1, 90.0, 93.2, 91.7),
  (1, CURRENT_DATE - INTERVAL '3 days', 93.1, 95.6, 90.5, 93.8, 92.0),
  (1, CURRENT_DATE - INTERVAL '2 days', 94.0, 96.0, 91.2, 94.1, 92.7),
  (1, CURRENT_DATE - INTERVAL '1 days', 94.7, 96.5, 92.0, 94.9, 93.0),
  (2, CURRENT_DATE - INTERVAL '2 days', 88.0, 90.0, 87.5, 89.0, 85.0),
  (3, CURRENT_DATE - INTERVAL '1 days', 96.0, 97.0, 95.0, 96.5, 96.0)
ON CONFLICT DO NOTHING;

INSERT INTO data_quality_issues (dataset_id, rule_id, metric_id, issue_date, title, description, severity, status, affected_count)
SELECT 1, 1, m.id, m.metric_date, 'Invalid phone numbers', 'Some phone numbers failed validation', 'high', 'open', 120
FROM data_quality_metrics m WHERE m.dataset_id = 1 ORDER BY m.metric_date DESC LIMIT 1;

INSERT INTO data_quality_issues (dataset_id, rule_id, metric_id, issue_date, title, description, severity, status, affected_count)
SELECT 1, 2, m.id, m.metric_date, 'Duplicate customer records', 'Potential duplicates detected', 'medium', 'in_progress', 45
FROM data_quality_metrics m WHERE m.dataset_id = 1 ORDER BY m.metric_date DESC OFFSET 1 LIMIT 1;
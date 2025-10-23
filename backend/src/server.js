import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, runQuery } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve static frontend
const frontendDir = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendDir));

app.get('/api/health', async (req, res) => {
  try {
    const db = await pool.query('SELECT 1');
    res.json({ status: 'ok', db: db.rowCount === 1 });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Departments
app.get('/api/departments', async (req, res) => {
  try {
    const rows = await runQuery('SELECT DISTINCT department FROM datasets ORDER BY department');
    res.json(rows.map(r => r.department));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Datasets
app.get('/api/datasets', async (req, res) => {
  try {
    const { department } = req.query;
    const where = department ? 'WHERE department = $1' : '';
    const params = department ? [department] : [];
    const datasets = await runQuery(
      `SELECT d.*, (
         SELECT metric_date FROM data_quality_metrics m
         WHERE m.dataset_id = d.id
         ORDER BY metric_date DESC LIMIT 1
       ) AS last_metric_date
       FROM datasets d ${where} ORDER BY name`, params);
    res.json(datasets);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rules
app.get('/api/rules', async (_req, res) => {
  try {
    const rules = await runQuery(
      `SELECT r.*, d.name AS dataset_name
       FROM quality_rules r LEFT JOIN datasets d ON d.id = r.dataset_id
       ORDER BY r.created_at DESC`);
    res.json(rules);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/rules', async (req, res) => {
  try {
    const { name, description, metric_type, threshold, dataset_id } = req.body;
    const rows = await runQuery(
      `INSERT INTO quality_rules(name, description, metric_type, threshold, dataset_id)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`, [name, description, metric_type, threshold, dataset_id]);
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Issues
app.get('/api/issues/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
    const issues = await runQuery(
      `SELECT i.*, d.name AS dataset_name, r.name AS rule_name
       FROM data_quality_issues i
       LEFT JOIN datasets d ON d.id = i.dataset_id
       LEFT JOIN quality_rules r ON r.id = i.rule_id
       ORDER BY i.issue_date DESC, i.created_at DESC
       LIMIT $1`, [limit]);
    res.json(issues);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/issues', async (_req, res) => {
  try {
    const issues = await runQuery(
      `SELECT i.*, d.name AS dataset_name, r.name AS rule_name
       FROM data_quality_issues i
       LEFT JOIN datasets d ON d.id = i.dataset_id
       LEFT JOIN quality_rules r ON r.id = i.rule_id
       ORDER BY i.issue_date DESC, i.created_at DESC`);
    res.json(issues);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dashboard tiles
app.get('/api/dashboard/tiles', async (req, res) => {
  try {
    const { department } = req.query;
    const where = department ? 'WHERE d.department = $1' : '';
    const params = department ? [department] : [];
    const rows = await runQuery(
      `SELECT AVG(v.overall_score) AS overall_score,
              AVG(v.completeness) AS completeness,
              AVG(v.accuracy) AS accuracy,
              AVG(v.consistency) AS consistency,
              AVG(v.timeliness) AS timeliness
         FROM v_metric_latest v
         JOIN datasets d ON d.id = v.dataset_id
         ${where}`, params);
    res.json(rows[0] || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dashboard trends
app.get('/api/dashboard/trends', async (req, res) => {
  try {
    const { department } = req.query;
    const where = department ? 'WHERE d.department = $1' : '';
    const params = department ? [department] : [];
    const rows = await runQuery(
      `SELECT m.metric_date::text AS date,
              AVG(m.overall_score) AS overall_score,
              AVG(m.completeness) AS completeness,
              AVG(m.accuracy) AS accuracy,
              AVG(m.consistency) AS consistency,
              AVG(m.timeliness) AS timeliness
         FROM data_quality_metrics m
         JOIN datasets d ON d.id = m.dataset_id
         ${where}
        GROUP BY m.metric_date
        ORDER BY m.metric_date ASC` , params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Schema
app.get('/api/schema', async (_req, res) => {
  try {
    const tables = await runQuery(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name`);
    const columns = await runQuery(
      `SELECT table_name, column_name, data_type, is_nullable
         FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position`);
    const fks = await runQuery(
      `SELECT tc.table_name AS source_table,
              kcu.column_name AS source_column,
              ccu.table_name AS target_table,
              ccu.column_name AS target_column
         FROM information_schema.table_constraints AS tc
         JOIN information_schema.key_column_usage AS kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage AS ccu
           ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`);
    res.json({ tables, columns, relationships: fks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Data load endpoints
app.post('/api/data/load/metrics', async (req, res) => {
  try {
    const { datasetId, records } = req.body;
    if (!datasetId || !Array.isArray(records)) {
      return res.status(400).json({ error: 'datasetId and records required' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const r of records) {
        await client.query(
          `INSERT INTO data_quality_metrics (dataset_id, metric_date, overall_score, completeness, accuracy, consistency, timeliness)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (dataset_id, metric_date)
           DO UPDATE SET overall_score = EXCLUDED.overall_score,
                         completeness = EXCLUDED.completeness,
                         accuracy = EXCLUDED.accuracy,
                         consistency = EXCLUDED.consistency,
                         timeliness = EXCLUDED.timeliness`,
          [datasetId, r.metric_date, r.overall_score, r.completeness, r.accuracy, r.consistency, r.timeliness]
        );
      }
      await client.query('COMMIT');
      res.json({ status: 'ok', inserted: records.length });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/data/load/issues', async (req, res) => {
  try {
    const { datasetId, records } = req.body;
    if (!datasetId || !Array.isArray(records)) {
      return res.status(400).json({ error: 'datasetId and records required' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const r of records) {
        await client.query(
          `INSERT INTO data_quality_issues (dataset_id, rule_id, issue_date, severity, title, details, sample_records)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [datasetId, r.rule_id || null, r.issue_date, r.severity, r.title, r.details || null, r.sample_records || null]
        );
      }
      await client.query('COMMIT');
      res.json({ status: 'ok', inserted: records.length });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fallback to SPA
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

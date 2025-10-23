import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://dq_user:dq_password@localhost:5432/dq_db',
});

app.get('/api/health', async (_req, res) => {
  try {
    const r = await pool.query('SELECT 1 as ok');
    res.json({ status: 'ok', db: r.rows[0].ok });
  } catch (e) {
    res.status(500).json({ status: 'error', error: String(e) });
  }
});

// Datasets
app.get('/api/datasets', async (_req, res) => {
  const r = await pool.query('SELECT * FROM datasets ORDER BY id');
  res.json(r.rows);
});

// Metrics overview and trends
app.get('/api/metrics', async (req, res) => {
  const { datasetId } = req.query;
  const params: any[] = [];
  let where = '';
  if (datasetId) {
    params.push(datasetId);
    where = ;
  }
  const r = await pool.query(
    ,
    params
  );
  res.json(r.rows);
});

// Issues list
app.get('/api/issues', async (req, res) => {
  const { status, department } = req.query as any;
  const params: any[] = [];
  const clauses: string[] = [];
  if (status) { params.push(status); clauses.push(); }
  if (department) { params.push(department); clauses.push(); }
  const where = clauses.length ?  : '';
  const sql = ;
  const r = await pool.query(sql, params);
  res.json(r.rows);
});

// Rules
app.get('/api/rules', async (_req, res) => {
  const r = await pool.query('SELECT * FROM quality_rules ORDER BY id');
  res.json(r.rows);
});

// Schema overview
app.get('/api/schema', async (_req, res) => {
  const r = await pool.query('SELECT * FROM schema_overview ORDER BY table_name');
  res.json(r.rows);
});

// Recent issues for dashboard
app.get('/api/dashboard', async (_req, res) => {
  const overview = await pool.query();
  const recentIssues = await pool.query();
  res.json({ overview: overview.rows, recentIssues: recentIssues.rows });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log();
});

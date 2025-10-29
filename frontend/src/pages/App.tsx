import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

export default function App() {
  const { pathname } = useLocation()
  return (
    <div style={{ fontFamily: 'Inter, system-ui, Arial' }}>
      <header style={{ padding: 16, borderBottom: '1px solid #eee' }}>
        <h1 style={{ margin: 0 }}>Data Quality Dashboard</h1>
        <p style={{ margin: '4px 0', color: '#666' }}>Path: {pathname}</p>
        <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/datasets">Datasets</Link>
          <Link to="/issues">Issues</Link>
          <Link to="/rules">Rules</Link>
          <Link to="/load-data">Load Data</Link>
          <Link to="/schema">Schema</Link>
        </nav>
      </header>
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  )
}

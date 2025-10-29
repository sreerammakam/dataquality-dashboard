import React from 'react'
import { useQuery } from '@tanstack/react-query'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch ' + url)
  return res.json()
}

function Tile({ title, value }: { title: string, value?: number }) {
  return (
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{value?.toFixed(1) ?? '—'}</div>
    </div>
  )
}

export default function Dashboard() {
  const [department, setDepartment] = React.useState<string>('')

  const { data: departments } = useQuery<string[]>({
    queryKey: ['departments'],
    queryFn: () => fetchJSON('/api/departments')
  })

  const { data: tiles } = useQuery<any>({
    queryKey: ['tiles', department],
    queryFn: () => fetchJSON(`/api/dashboard/tiles${department ? `?department=${encodeURIComponent(department)}` : ''}`)
  })

  const { data: trends } = useQuery<any[]>({
    queryKey: ['trends', department],
    queryFn: () => fetchJSON(`/api/dashboard/trends${department ? `?department=${encodeURIComponent(department)}` : ''}`)
  })

  const { data: recent } = useQuery<any[]>({
    queryKey: ['issues', 'recent'],
    queryFn: () => fetchJSON('/api/issues/recent?limit=10')
  })

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <label>Department: </label>
        <select value={department} onChange={e => setDepartment(e.target.value)}>
          <option value="">All</option>
          {departments?.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Tile title="Overall" value={tiles?.overall_score} />
        <Tile title="Completeness" value={tiles?.completeness} />
        <Tile title="Accuracy" value={tiles?.accuracy} />
        <Tile title="Consistency" value={tiles?.consistency} />
        <Tile title="Timeliness" value={tiles?.timeliness} />
      </section>

      <section>
        <h3>Quality Trends</h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Overall</th>
                <th>Completeness</th>
                <th>Accuracy</th>
                <th>Consistency</th>
                <th>Timeliness</th>
              </tr>
            </thead>
            <tbody>
              {trends?.map((r, i) => (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td>{Number(r.overall_score).toFixed(1)}</td>
                  <td>{Number(r.completeness).toFixed(1)}</td>
                  <td>{Number(r.accuracy).toFixed(1)}</td>
                  <td>{Number(r.consistency).toFixed(1)}</td>
                  <td>{Number(r.timeliness).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3>Recent Issues</h3>
        <ul>
          {recent?.map((i) => (
            <li key={i.id}>
              <strong>{i.title}</strong> in <em>{i.dataset_name}</em> — {i.severity} — {i.issue_date}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

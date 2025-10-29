import React from 'react'
import { useQuery } from '@tanstack/react-query'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch ' + url)
  return res.json()
}

export default function Datasets() {
  const [department, setDepartment] = React.useState<string>('')
  const { data: departments } = useQuery<string[]>({
    queryKey: ['departments'],
    queryFn: () => fetchJSON('/api/departments')
  })

  const { data } = useQuery<any[]>({
    queryKey: ['datasets', department],
    queryFn: () => fetchJSON(`/api/datasets${department ? `?department=${encodeURIComponent(department)}` : ''}`)
  })

  return (
    <div>
      <h3>Datasets</h3>
      <div style={{ marginBottom: 8 }}>
        <label>Department: </label>
        <select value={department} onChange={e => setDepartment(e.target.value)}>
          <option value="">All</option>
          {departments?.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Department</th>
            <th>Description</th>
            <th>Last Metric Date</th>
          </tr>
        </thead>
        <tbody>
          {data?.map(d => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td>{d.department}</td>
              <td>{d.description}</td>
              <td>{d.last_metric_date ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

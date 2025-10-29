import React from 'react'
import { useQuery } from '@tanstack/react-query'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch ' + url)
  return res.json()
}

export default function Rules() {
  const { data } = useQuery<any[]>({
    queryKey: ['rules'],
    queryFn: () => fetchJSON('/api/rules')
  })

  return (
    <div>
      <h3>Quality Rules</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Dataset</th>
            <th>Metric Type</th>
            <th>Threshold</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {data?.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.dataset_name ?? r.dataset_id}</td>
              <td>{r.metric_type}</td>
              <td>{r.threshold}</td>
              <td>{String(r.is_active)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import React from 'react'
import { useQuery } from '@tanstack/react-query'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch ' + url)
  return res.json()
}

export default function Issues() {
  const { data } = useQuery<any[]>({
    queryKey: ['issues'],
    queryFn: () => fetchJSON('/api/issues')
  })

  return (
    <div>
      <h3>Quality Issues</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Dataset</th>
            <th>Rule</th>
            <th>Severity</th>
            <th>Title</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.map(i => (
            <tr key={i.id}>
              <td>{i.issue_date}</td>
              <td>{i.dataset_name}</td>
              <td>{i.rule_name ?? '—'}</td>
              <td>{i.severity}</td>
              <td>{i.title}</td>
              <td>{i.status ?? 'open'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

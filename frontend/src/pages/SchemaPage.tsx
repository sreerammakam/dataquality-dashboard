import React from 'react'
import { useQuery } from '@tanstack/react-query'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch ' + url)
  return res.json()
}

export default function SchemaPage() {
  const { data } = useQuery<any>({
    queryKey: ['schema'],
    queryFn: () => fetchJSON('/api/schema')
  })

  return (
    <div>
      <h3>Schema</h3>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h4>Tables</h4>
          <ul>
            {data?.tables?.map((t: any) => <li key={t.table_name}>{t.table_name}</li>)}
          </ul>
        </div>
        <div>
          <h4>Relationships</h4>
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Column</th>
                <th>Target</th>
                <th>Column</th>
              </tr>
            </thead>
            <tbody>
              {data?.relationships?.map((r: any, idx: number) => (
                <tr key={idx}>
                  <td>{r.source_table}</td>
                  <td>{r.source_column}</td>
                  <td>{r.target_table}</td>
                  <td>{r.target_column}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import React from 'react'

async function postJSON(url: string, body: any) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

export default function LoadData() {
  const [datasetId, setDatasetId] = React.useState('1')
  const [metricsText, setMetricsText] = React.useState('[{"metric_date":"2025-01-01","overall_score":90,"completeness":92,"accuracy":88,"consistency":91,"timeliness":93}]')
  const [issuesText, setIssuesText] = React.useState('[{"issue_date":"2025-01-02","severity":"high","title":"Missing emails","details":"5% missing"}]')
  const [message, setMessage] = React.useState('')

  const uploadMetrics = async () => {
    const records = JSON.parse(metricsText)
    const r = await postJSON('/api/data/load/metrics', { datasetId: Number(datasetId), records })
    setMessage(JSON.stringify(r))
  }

  const uploadIssues = async () => {
    const records = JSON.parse(issuesText)
    const r = await postJSON('/api/data/load/issues', { datasetId: Number(datasetId), records })
    setMessage(JSON.stringify(r))
  }

  return (
    <div>
      <h3>Load Data</h3>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <label>Dataset ID:&nbsp;</label>
          <input value={datasetId} onChange={e => setDatasetId(e.target.value)} style={{ width: 60 }} />
        </div>
        <div>
          <h4>Metrics JSON</h4>
          <textarea value={metricsText} onChange={e => setMetricsText(e.target.value)} rows={10} cols={60} />
          <div>
            <button onClick={uploadMetrics}>Upload Metrics</button>
          </div>
        </div>
        <div>
          <h4>Issues JSON</h4>
          <textarea value={issuesText} onChange={e => setIssuesText(e.target.value)} rows={10} cols={60} />
          <div>
            <button onClick={uploadIssues}>Upload Issues</button>
          </div>
        </div>
      </div>
      {message && (
        <pre style={{ background: '#f7f7f7', padding: 12, marginTop: 16 }}>{message}</pre>
      )}
    </div>
  )
}

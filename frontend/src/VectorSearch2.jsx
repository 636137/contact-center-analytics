import React, { useState } from 'react';
import { post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function VectorSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [view, setView] = useState('list');

  const search = async (q) => {
    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const response = await post({
        apiName: 'transcriptApi',
        path: '/search',
        options: {
          body: { query: q || query, top_k: 10 },
          headers: { Authorization: session.tokens.idToken.toString() }
        }
      }).response;
      const data = await response.body.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  };

  const viewFull = async (s3Key) => {
    try {
      const res = await fetch(`https://cc-transcripts-1772246760.s3.us-east-1.amazonaws.com/${s3Key}`);
      const data = await res.json();
      setTranscript(data);
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  if (transcript) {
    return (
      <div className="card">
        <button onClick={() => setTranscript(null)} className="btn">← Back</button>
        <h2>{transcript.entity_name}</h2>
        <div style={{background: '#f9f9f9', padding: '20px', borderRadius: '8px', whiteSpace: 'pre-wrap'}}>
          {transcript.transcript}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>🔍 Vector Search</h2>
      <textarea value={query} onChange={e => setQuery(e.target.value)} rows={3} placeholder="Search query..." />
      <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
        <button onClick={() => search()} disabled={loading || !query} className="btn btn-primary">
          {loading ? 'Searching...' : 'Search'}
        </button>
        {results.length > 0 && (
          <button onClick={() => setView(view === 'list' ? 'graph' : 'list')} className="btn">
            {view === 'list' ? '📊 Graph' : '📋 List'}
          </button>
        )}
      </div>

      {results.length > 0 && view === 'list' && (
        <div style={{marginTop: '20px'}}>
          {results.map((r, i) => (
            <div key={i} style={{padding: '15px', background: '#f9f9f9', borderRadius: '8px', marginBottom: '10px'}}>
              <strong>{r.metadata.entity_name}</strong> - {(r.similarity * 100).toFixed(1)}%
              <div style={{fontSize: '14px', margin: '10px 0'}}>{r.preview}</div>
              <button onClick={() => viewFull(r.s3_key)} className="btn" style={{fontSize: '12px', padding: '5px 10px', marginRight: '5px'}}>
                View Full
              </button>
              <button onClick={() => { setQuery(r.preview.substring(0, 200)); search(r.preview.substring(0, 200)); }} className="btn" style={{fontSize: '12px', padding: '5px 10px'}}>
                Find Similar
              </button>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && view === 'graph' && (
        <div style={{marginTop: '20px'}}>
          <svg width="100%" height="600" style={{border: '1px solid #ddd', borderRadius: '8px'}}>
            <circle cx="400" cy="300" r="30" fill="#667eea" />
            <text x="400" y="305" textAnchor="middle" fill="white" fontSize="12">Query</text>
            {results.slice(0, 8).map((r, i) => {
              const angle = (i / 8) * 2 * Math.PI;
              const x = 400 + 200 * Math.cos(angle);
              const y = 300 + 200 * Math.sin(angle);
              return (
                <g key={i}>
                  <line x1="400" y1="300" x2={x} y2={y} stroke="#ddd" strokeWidth={r.similarity * 5} />
                  <circle cx={x} cy={y} r={20 + r.similarity * 20} fill="#764ba2" opacity={0.3 + r.similarity * 0.7} style={{cursor: 'pointer'}} onClick={() => viewFull(r.s3_key)} />
                  <text x={x} y={y + 35} textAnchor="middle" fontSize="10">{(r.similarity * 100).toFixed(0)}%</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

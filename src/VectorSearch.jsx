import React, { useState } from 'react';
import { post, get } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

function VectorSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'graph'
  const [currentQuery, setCurrentQuery] = useState('');

  const search = async (searchQuery = query) => {
    setLoading(true);
    setCurrentQuery(searchQuery);
    try {
      const session = await fetchAuthSession();
      const response = await post({
        apiName: 'transcriptApi',
        path: '/search',
        options: {
          body: {
            query: searchQuery,
            top_k: 10
          },
          headers: {
            Authorization: session.tokens.idToken.toString()
          }
        }
      }).response;
      
      const data = await response.body.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Error searching:', error);
    }
    setLoading(false);
  };

  const viewTranscript = async (s3Key) => {
    try {
      const response = await fetch(`https://cc-transcripts-1772246760.s3.us-east-1.amazonaws.com/${s3Key}`);
      const data = await response.json();
      setSelectedTranscript(data);
    } catch (error) {
      console.error('Error loading transcript:', error);
    }
  };

  const findSimilar = (preview) => {
    setQuery(preview.substring(0, 200));
    search(preview.substring(0, 200));
    setSelectedTranscript(null);
  };

  if (selectedTranscript) {
    return (
      <div className="card">
        <button onClick={() => setSelectedTranscript(null)} className="btn" style={{marginBottom: '20px'}}>
          ← Back to Results
        </button>
        <h2>{selectedTranscript.entity_name || 'Transcript'}</h2>
        <div style={{background: '#f9f9f9', padding: '20px', borderRadius: '8px', whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>
          {selectedTranscript.transcript}
        </div>
        {selectedTranscript.analysis && (
          <div style={{marginTop: '20px', padding: '15px', background: '#e8f4f8', borderRadius: '8px'}}>
            <h3>Analysis</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
              <div><strong>CSAT:</strong> {selectedTranscript.analysis.csat_score}/5</div>
              <div><strong>Sentiment:</strong> {selectedTranscript.analysis.sentiment}</div>
              <div><strong>FCR:</strong> {selectedTranscript.analysis.first_call_resolution ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-title">🔍 Vector Similarity Search</h2>
      <p className="info-text">Find similar transcripts using AI-powered semantic search.</p>

      <div className="form-group">
        <label>Search Query</label>
        <textarea 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          rows={3}
          placeholder="Describe the type of interaction you're looking for..."
        />
      </div>

      <div style={{display: 'flex', gap: '10px'}}>
        <button onClick={() => search()} disabled={loading || !query} className="btn btn-primary">
          {loading ? 'Searching...' : 'Search Similar Transcripts'}
        </button>
        {results.length > 0 && (
          <button onClick={() => setViewMode(viewMode === 'list' ? 'graph' : 'list')} className="btn">
            {viewMode === 'list' ? '📊 Graph View' : '📋 List View'}
          </button>
        )}
      </div>

      {results.length > 0 && viewMode === 'list' && (
        <div style={{ marginTop: '30px' }}>
          <h3>Search Results ({results.length})</h3>
          {results.map((result, idx) => (
            <div key={idx} style={{ 
              padding: '15px', 
              background: '#f9f9f9', 
              borderRadius: '8px', 
              marginBottom: '15px',
              borderLeft: '4px solid #667eea'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong>{result.metadata.entity_name}</strong>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  Similarity: {(result.similarity * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#555', marginBottom: '10px' }}>
                {result.preview}
              </div>
              <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                <button onClick={() => viewTranscript(result.s3_key)} className="btn" style={{fontSize: '12px', padding: '5px 10px'}}>
                  View Full Transcript
                </button>
                <button onClick={() => findSimilar(result.preview)} className="btn" style={{fontSize: '12px', padding: '5px 10px'}}>
                  Find Similar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && viewMode === 'graph' && (
        <div style={{ marginTop: '30px', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{marginBottom: '20px', color: '#333'}}>Graph Visualization</h3>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <svg width="900" height="700" viewBox="0 0 900 700" style={{maxWidth: '100%', background: '#fafbfc', borderRadius: '8px'}}>
              {/* Result nodes in circle */}
              {results.slice(0, 8).map((result, idx) => {
                const angle = (idx / 8) * 2 * Math.PI - Math.PI / 2;
                const x = 450 + 280 * Math.cos(angle);
                const y = 350 + 280 * Math.sin(angle);
                const similarity = result.similarity;
                const nodeRadius = 35 + similarity * 25;
                
                return (
                  <g key={idx}>
                    {/* Connection line with gradient */}
                    <line 
                      x1="450" 
                      y1="350" 
                      x2={x} 
                      y2={y} 
                      stroke="#667eea" 
                      strokeWidth={3 + similarity * 4}
                      opacity={0.3}
                      strokeDasharray={similarity < 0.5 ? "5,5" : "0"}
                    />
                    {/* Result node with shadow */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={nodeRadius + 3} 
                      fill="#000"
                      opacity={0.1}
                    />
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={nodeRadius} 
                      fill="url(#grad1)"
                      stroke="#fff"
                      strokeWidth="3"
                      style={{cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'}}
                      onClick={() => viewTranscript(result.s3_key)}
                    />
                    {/* Similarity percentage */}
                    <text 
                      x={x} 
                      y={y + 5} 
                      textAnchor="middle" 
                      fontSize="16" 
                      fill="#fff"
                      fontWeight="bold"
                    >
                      {(similarity * 100).toFixed(0)}%
                    </text>
                    {/* Entity name background */}
                    <rect
                      x={x - 60}
                      y={y + nodeRadius + 10}
                      width="120"
                      height="30"
                      fill="#fff"
                      rx="4"
                      opacity="0.9"
                    />
                    {/* Entity name */}
                    <text 
                      x={x} 
                      y={y + nodeRadius + 28} 
                      textAnchor="middle" 
                      fontSize="11" 
                      fill="#333"
                      fontWeight="500"
                    >
                      {result.metadata.entity_name.substring(0, 18)}
                    </text>
                  </g>
                );
              })}
              
              {/* Center query node on top */}
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#667eea', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#764ba2', stopOpacity: 1}} />
                </linearGradient>
              </defs>
              <circle cx="450" cy="350" r="53" fill="#000" opacity="0.15" />
              <circle cx="450" cy="350" r="50" fill="#667eea" stroke="#fff" strokeWidth="4" style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'}} />
              <text x="450" y="355" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">QUERY</text>
            })}
          </svg>
          <p style={{textAlign: 'center', marginTop: '10px', color: '#666', fontSize: '14px'}}>
            Click on nodes to view transcripts. Line thickness represents similarity strength.
          </p>
        </div>
      )}
    </div>
  );
}

export default VectorSearch;

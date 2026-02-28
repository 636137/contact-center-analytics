import React, { useState } from 'react';
import { post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

function VectorSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    minCsat: 1,
    maxCsat: 5,
    fcr: null,
    sentiment: null
  });

  const search = async () => {
    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const response = await post({
        apiName: 'transcriptApi',
        path: '/search',
        options: {
          body: {
            query,
            k: 10,
            filters
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div className="form-group">
          <label>Min CSAT</label>
          <select value={filters.minCsat} onChange={(e) => setFilters({...filters, minCsat: parseInt(e.target.value)})}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        <div className="form-group">
          <label>FCR</label>
          <select value={filters.fcr || ''} onChange={(e) => setFilters({...filters, fcr: e.target.value ? e.target.value === 'true' : null})}>
            <option value="">Any</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div className="form-group">
          <label>Sentiment</label>
          <select value={filters.sentiment || ''} onChange={(e) => setFilters({...filters, sentiment: e.target.value || null})}>
            <option value="">Any</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>
      </div>

      <button onClick={search} disabled={loading || !query} className="btn btn-primary">
        {loading ? 'Searching...' : 'Search Similar Transcripts'}
      </button>

      {results.length > 0 && (
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
                <strong>Scenario:</strong> {result.metadata.scenario}
              </div>
              <div style={{ display: 'flex', gap: '15px', fontSize: '13px' }}>
                <span>CSAT: {result.metadata.csat}/5</span>
                <span>FCR: {result.metadata.fcr ? '✓' : '✗'}</span>
                <span>Sentiment: {result.metadata.sentiment}</span>
                <span>AHT: {Math.floor(result.metadata.aht / 60)}m {result.metadata.aht % 60}s</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VectorSearch;

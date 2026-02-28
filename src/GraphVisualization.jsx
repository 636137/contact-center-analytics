import React, { useState, useEffect } from 'react';
import { post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

function GraphVisualization() {
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [queryType, setQueryType] = useState('customer_journey');
  const [entityId, setEntityId] = useState('');
  const [loading, setLoading] = useState(false);

  const queries = {
    customer_journey: 'Customer interaction history',
    agent_performance: 'Agent performance network',
    issue_clustering: 'Related issues clustering',
    resolution_paths: 'Successful resolution patterns'
  };

  const executeQuery = async () => {
    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const response = await post({
        apiName: 'transcriptApi',
        path: '/graph/query',
        options: {
          body: {
            queryType,
            entityId
          },
          headers: {
            Authorization: session.tokens.idToken.toString()
          }
        }
      }).response;
      
      const data = await response.body.json();
      setGraphData(data);
    } catch (error) {
      console.error('Error querying graph:', error);
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <h2 className="section-title">🕸️ Graph Analytics</h2>
      <p className="info-text">Explore relationships between customers, agents, issues, and transcripts.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div className="form-group">
          <label>Query Type</label>
          <select value={queryType} onChange={(e) => setQueryType(e.target.value)}>
            {Object.entries(queries).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Entity ID (optional)</label>
          <input 
            value={entityId} 
            onChange={(e) => setEntityId(e.target.value)} 
            placeholder="CUST-12345"
          />
        </div>
      </div>

      <button onClick={executeQuery} disabled={loading} className="btn btn-primary">
        {loading ? 'Querying Graph...' : 'Execute Query'}
      </button>

      {graphData && (
        <div style={{ marginTop: '30px' }}>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '20px', 
            borderRadius: '8px',
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
            <p style={{ color: '#666', textAlign: 'center' }}>
              Graph visualization would render here using D3.js or vis.js
            </p>
            <div style={{ marginTop: '20px', textAlign: 'left', width: '100%' }}>
              <h4>Graph Statistics:</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li>Nodes: {graphData.nodeCount || 0}</li>
                <li>Edges: {graphData.edgeCount || 0}</li>
                <li>Connected Components: {graphData.components || 0}</li>
              </ul>
            </div>
          </div>

          {graphData.insights && (
            <div style={{ marginTop: '20px' }}>
              <h3>Key Insights</h3>
              {graphData.insights.map((insight, idx) => (
                <div key={idx} className="result-box" style={{ marginBottom: '10px' }}>
                  {insight}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GraphVisualization;

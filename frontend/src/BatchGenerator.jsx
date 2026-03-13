import React, { useState } from 'react';
import { post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

function BatchGenerator({ profiles }) {
  const [entityName, setEntityName] = useState('');
  const [profileId, setProfileId] = useState('');
  const [count, setCount] = useState(100);
  const [scenarios, setScenarios] = useState('');
  const [loading, setLoading] = useState(false);
  const [batchId, setBatchId] = useState(null);
  const [status, setStatus] = useState(null);
  const [executionArn, setExecutionArn] = useState(null);
  const [progress, setProgress] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const startBatch = async () => {
    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const response = await post({
        apiName: 'transcriptApi',
        path: '/batch/create',
        options: {
          body: {
            entityName,
            profileId,
            count,
            scenarios: scenarios.split('\n').filter(s => s.trim())
          },
          headers: {
            Authorization: session.tokens.idToken.toString()
          }
        }
      }).response;
      
      const data = await response.body.json();
      setBatchId(data.batch_id);
      setExecutionArn(data.execution_arn);
      setStatus('RUNNING');
      setTotalCount(count);
      setProgress(0);
      pollProgress(data.execution_arn);
    } catch (error) {
      console.error('Error starting batch:', error);
      setStatus('ERROR: ' + error.message);
    }
    setLoading(false);
  };

  const pollProgress = (arn) => {
    const interval = setInterval(async () => {
      try {
        // Check DynamoDB for completed transcripts
        const session = await fetchAuthSession();
        const response = await post({
          apiName: 'transcriptApi',
          path: '/batch/status',
          options: {
            body: { batchId },
            headers: {
              Authorization: session.tokens.idToken.toString()
            }
          }
        }).response;
        
        const data = await response.body.json();
        const completed = data.completed || 0;
        setProgress(Math.round((completed / totalCount) * 100));
        
        if (completed >= totalCount || data.status === 'FAILED') {
          clearInterval(interval);
          setStatus(data.status || 'COMPLETED');
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    }, 3000);
  };

  return (
    <div className="card">
      <h2 className="section-title">🚀 Batch Transcript Generation</h2>
      <p className="info-text">Generate thousands of transcripts at scale for POC demonstrations.</p>

      <div className="form-group">
        <label>Entity Name</label>
        <input 
          value={entityName} 
          onChange={(e) => setEntityName(e.target.value)} 
          placeholder="Department of Motor Vehicles"
        />
      </div>

      <div className="form-group">
        <label>Model Profile</label>
        <select value={profileId} onChange={(e) => setProfileId(e.target.value)}>
          <option value="">Select a profile...</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Number of Transcripts</label>
        <input 
          type="number" 
          value={count} 
          onChange={(e) => setCount(parseInt(e.target.value))} 
          min="10"
          max="1000"
        />
      </div>

      <div className="form-group">
        <label>Scenarios (one per line)</label>
        <textarea 
          value={scenarios} 
          onChange={(e) => setScenarios(e.target.value)} 
          rows={8}
          placeholder="Customer calling about license renewal&#10;Technical issue with online portal&#10;Billing inquiry for vehicle registration"
        />
      </div>

      <button 
        onClick={startBatch} 
        disabled={loading || !entityName || !profileId || !scenarios}
        className="btn btn-primary"
      >
        {loading ? 'Starting Batch...' : `Generate ${count} Transcripts`}
      </button>

      {batchId && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#f0f8ff', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px' }}>Batch Status</h3>
          <p><strong>Batch ID:</strong> {batchId}</p>
          <p><strong>Status:</strong> <span style={{ 
            color: status === 'COMPLETED' ? 'green' : status?.includes('ERROR') || status === 'FAILED' ? 'red' : 'orange',
            fontWeight: 'bold'
          }}>{status}</span></p>
          
          {status === 'RUNNING' && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '24px', 
                background: '#e0e0e0', 
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${progress}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  transition: 'width 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {progress > 10 && `${progress}%`}
                </div>
              </div>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Processing {totalCount} transcripts in parallel batches...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BatchGenerator;

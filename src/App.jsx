import React, { useState, useEffect } from 'react';
import { post } from 'aws-amplify/api';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import './App.css';
import BatchGenerator from './BatchGenerator';
import VectorSearch from './VectorSearch2';
import TranscriptDisplay from './TranscriptDisplay';
import AnalysisDisplay from './AnalysisDisplay';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('single');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [entityName, setEntityName] = useState('');
  const [length, setLength] = useState('Moderate');
  const [description, setDescription] = useState('');
  const [suggestedIssues, setSuggestedIssues] = useState([]);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      loadProfiles();
    } catch {
      setUser(null);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signIn({ username: email, password });
      await checkUser();
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  const loadProfiles = async () => {
    try {
      const session = await fetchAuthSession();
      const response = await post({
        apiName: 'transcriptApi',
        path: '/transcript',
        options: {
          body: { operation: 'listProfiles' },
          headers: {
            Authorization: session.tokens.idToken.toString()
          }
        }
      }).response;
      const data = await response.body.json();
      setProfiles(data.profiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const generateIssues = async () => {
    if (!description) return;
    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const response = await post({
        apiName: 'transcriptApi',
        path: '/transcript',
        options: {
          body: { operation: 'generateIssues', description },
          headers: {
            Authorization: session.tokens.idToken.toString()
          }
        }
      }).response;
      const data = await response.body.json();
      setSuggestedIssues(data.issues);
      setStep(2);
    } catch (error) {
      console.error('Error generating issues:', error);
    }
    setLoading(false);
  };

  const generateTranscript = async () => {
    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const response = await post({
        apiName: 'transcriptApi',
        path: '/transcript',
        options: {
          body: {
            operation: 'generateTranscript',
            profileId: selectedProfile,
            entityName,
            length,
            description,
            additionalIssues: selectedIssues
          },
          headers: {
            Authorization: session.tokens.idToken.toString()
          }
        }
      }).response;
      const data = await response.body.json();
      setTranscript(data.transcript);
      setStep(3);
      analyzeTranscript(data.transcript);
    } catch (error) {
      console.error('Error generating transcript:', error);
      setLoading(false);
    }
  };

  const analyzeTranscript = async (transcriptText) => {
    try {
      const session = await fetchAuthSession();
      const response = await post({
        apiName: 'transcriptApi',
        path: '/transcript',
        options: {
          body: {
            operation: 'analyzeTranscript',
            transcript: transcriptText,
            entityName
          },
          headers: {
            Authorization: session.tokens.idToken.toString()
          }
        }
      }).response;
      const data = await response.body.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error analyzing transcript:', error);
    }
    setLoading(false);
  };

  const toggleIssue = (issue) => {
    setSelectedIssues(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  if (!user) {
    return (
      <div className="container">
        <div className="card login-card">
          <h1>Contact Center Analytics</h1>
          <h2>Sign in to continue</h2>
          <form onSubmit={handleSignIn}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@example.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" />
            </div>
            {authError && <div className="error-message">{authError}</div>}
            <button type="submit" className="btn btn-primary">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🎯 Contact Center Analytics Platform</h1>
        <button onClick={handleSignOut} className="btn btn-outline">Sign Out</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', justifyContent: 'center' }}>
        <button 
          onClick={() => setActiveTab('single')} 
          className={`btn ${activeTab === 'single' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Single Transcript
        </button>
        <button 
          onClick={() => setActiveTab('batch')} 
          className={`btn ${activeTab === 'batch' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Batch Generation
        </button>
        <button 
          onClick={() => setActiveTab('search')} 
          className={`btn ${activeTab === 'search' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Vector Search
        </button>
      </div>

      {activeTab === 'batch' && <BatchGenerator profiles={profiles} />}
      {activeTab === 'search' && <VectorSearch />}
      {activeTab === 'single' && (
        <>
          <div className="step-indicator">
            <div className={`step ${step === 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Configuration</div>
            </div>
            <div className={`step ${step === 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Additional Issues</div>
            </div>
            <div className={`step ${step === 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Results</div>
            </div>
          </div>

          {step === 1 && (
        <div className="card">
          <h2 className="section-title">Step 1: Configuration</h2>
          <p className="info-text">Configure your contact center transcript generation settings below.</p>
          
          <div className="form-group">
            <label>Model Profile</label>
            <select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)}>
              <option value="">Select a model profile...</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Government Entity Name</label>
            <input value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="e.g., Department of Motor Vehicles" />
          </div>

          <div className="form-group">
            <label>Transcript Length</label>
            <select value={length} onChange={(e) => setLength(e.target.value)}>
              <option value="Brief">Brief - Quick interaction</option>
              <option value="Moderate">Moderate - Standard conversation</option>
              <option value="Verbose">Verbose - Detailed exchange</option>
            </select>
          </div>

          <div className="form-group">
            <label>Scenario Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the contact center scenario in detail..." />
          </div>

          <button onClick={generateIssues} disabled={!selectedProfile || !entityName || !description || loading} className="btn btn-primary">
            {loading ? 'Generating Issues' : 'Next: Additional Issues →'}
          </button>
          </div>
        )}

          {step === 2 && (
        <div className="card">
          <h2 className="section-title">Step 2: Additional Issues (Optional)</h2>
          <p className="info-text">Select additional issues to include in the conversation for a more realistic scenario.</p>
          
          {suggestedIssues.map((issue, idx) => (
            <div key={idx} className="checkbox-group">
              <label>
                <input type="checkbox" checked={selectedIssues.includes(issue)} onChange={() => toggleIssue(issue)} />
                {issue}
              </label>
            </div>
          ))}

          <div className="button-group">
            <button onClick={() => setStep(1)} className="btn btn-secondary">← Back</button>
            <button onClick={generateTranscript} disabled={loading} className="btn btn-primary" style={{flex: 1}}>
              {loading ? 'Generating Transcript' : 'Generate Transcript →'}
            </button>
          </div>
          </div>
        )}

          {step === 3 && (
          <div>
            <div className="card">
            <h2 className="section-title">📝 Generated Transcript</h2>
            <div className="result-box">
              <TranscriptDisplay transcript={transcript} />
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">📊 Post Interaction Analytics</h2>
            {loading ? (
              <div className="loading">Analyzing transcript</div>
            ) : (
              <div className="result-box">
                <AnalysisDisplay analysis={analysis} />
              </div>
            )}
          </div>

          <div className="card">
            <button onClick={() => { setStep(1); setTranscript(''); setAnalysis(''); setSuggestedIssues([]); setSelectedIssues([]); }} className="btn btn-primary">
              ← Generate Another Transcript
            </button>
          </div>
        </div>
        )}
        </>
      )}
    </div>
  );
}

export default App;

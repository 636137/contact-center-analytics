import React from 'react';

function AnalysisDisplay({ analysis }) {
  const parseAnalysis = (text) => {
    const sections = {
      issues: [],
      actions: [],
      outcomes: [],
      csat: null,
      fcr: null,
      performance: [],
      summary: ''
    };

    const lines = text.split('\n');
    let currentSection = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.includes('ISSUES IDENTIFIED')) {
        currentSection = 'issues';
      } else if (trimmed.includes('ACTIONS TO RESOLVE')) {
        currentSection = 'actions';
      } else if (trimmed.includes('OUTCOMES')) {
        currentSection = 'outcomes';
      } else if (trimmed.includes('PREDICTED CSAT')) {
        currentSection = 'csat';
      } else if (trimmed.includes('FCR')) {
        currentSection = 'fcr';
      } else if (trimmed.includes('AGENT PERFORMANCE')) {
        currentSection = 'performance';
      } else if (trimmed.includes('OVERALL')) {
        currentSection = 'summary';
      } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        const content = trimmed.substring(1).trim();
        if (currentSection === 'issues') sections.issues.push(content);
        else if (currentSection === 'actions') sections.actions.push(content);
        else if (currentSection === 'outcomes') sections.outcomes.push(content);
        else if (currentSection === 'performance') sections.performance.push(content);
      } else if (trimmed && currentSection === 'csat') {
        const match = trimmed.match(/(\d)/);
        if (match) sections.csat = parseInt(match[1]);
      } else if (trimmed && currentSection === 'fcr') {
        sections.fcr = trimmed.toLowerCase().includes('true');
      } else if (trimmed && currentSection === 'summary') {
        sections.summary += trimmed + ' ';
      }
    });

    return sections;
  };

  const sections = parseAnalysis(analysis);

  const getCsatClass = (score) => {
    if (score >= 4) return 'csat-high';
    if (score >= 3) return 'csat-medium';
    return 'csat-low';
  };

  return (
    <div>
      {/* Metrics Row */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {sections.csat && (
          <span className={`metric-badge ${getCsatClass(sections.csat)}`}>
            CSAT: {sections.csat}/5
          </span>
        )}
        {sections.fcr !== null && (
          <span className={`metric-badge ${sections.fcr ? 'fcr-yes' : 'fcr-no'}`}>
            FCR: {sections.fcr ? 'Yes' : 'No'}
          </span>
        )}
      </div>

      {/* Issues */}
      {sections.issues.length > 0 && (
        <div className="analysis-section">
          <h3>🔍 Issues Identified</h3>
          {sections.issues.map((issue, idx) => (
            <span key={idx} className="issue-tag">{issue}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      {sections.actions.length > 0 && (
        <div className="analysis-section">
          <h3>✅ Actions Taken</h3>
          {sections.actions.map((action, idx) => (
            <span key={idx} className="action-tag">{action}</span>
          ))}
        </div>
      )}

      {/* Outcomes */}
      {sections.outcomes.length > 0 && (
        <div className="analysis-section">
          <h3>📈 Outcomes</h3>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {sections.outcomes.map((outcome, idx) => (
              <li key={idx}>{outcome}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Performance */}
      {sections.performance.length > 0 && (
        <div className="analysis-section">
          <h3>⭐ Agent Performance</h3>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {sections.performance.map((perf, idx) => (
              <li key={idx}>{perf}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {sections.summary && (
        <div className="analysis-section">
          <h3>📝 Summary</h3>
          <p style={{ margin: 0, lineHeight: '1.6' }}>{sections.summary}</p>
        </div>
      )}

      {/* Fallback: Show raw if parsing failed */}
      {!sections.csat && !sections.issues.length && (
        <div style={{ whiteSpace: 'pre-wrap' }}>{analysis}</div>
      )}
    </div>
  );
}

export default AnalysisDisplay;

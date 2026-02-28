import React from 'react';

function TranscriptDisplay({ transcript }) {
  const formatTranscript = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    return lines.map((line, idx) => {
      const isAgent = line.toLowerCase().startsWith('agent:');
      const isCustomer = line.toLowerCase().startsWith('customer:');
      
      if (isAgent || isCustomer) {
        const [speaker, ...rest] = line.split(':');
        const content = rest.join(':').trim();
        
        return (
          <div key={idx} className={`transcript-line ${isAgent ? 'agent-line' : 'customer-line'}`}>
            <span className={`speaker-label ${isAgent ? 'agent-label' : 'customer-label'}`}>
              {speaker}:
            </span>
            <span>{content}</span>
          </div>
        );
      }
      
      return <div key={idx} className="transcript-line">{line}</div>;
    });
  };

  return <div>{formatTranscript(transcript)}</div>;
}

export default TranscriptDisplay;

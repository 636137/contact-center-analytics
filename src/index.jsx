import { Amplify } from 'aws-amplify';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_4uXkkemhx',
      userPoolClientId: '32rv574bo5i4iun9j0roi7s4lv',
      loginWith: {
        email: true
      }
    }
  },
  API: {
    REST: {
      transcriptApi: {
        endpoint: 'https://ifctye61ue.execute-api.us-east-1.amazonaws.com/prod',
        region: 'us-east-1'
      }
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

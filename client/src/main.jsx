import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@fontsource/inter';
import './styles/variables.css';
import './styles/glass.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/themes/immobilien.css';
import './styles/themes/krypto.css';
import './styles/themes/finanz.css';
import './styles/themes/versicherung.css';
import './styles/themes/investment.css';
import './styles/kanban.css';
import './styles/dashboard.css';
import './styles/market.css';
import './styles/ai.css';
import './styles/agents.css';
import './styles/pipeline.css';
import './styles/export.css';
import App from './App.jsx';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

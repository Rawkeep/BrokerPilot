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
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Find the <div id="root"> in index.html and render the app into it.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter gives the whole tree access to routing. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import SimpleApp from './App-simple';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <SimpleApp />
    </React.StrictMode>
  );
}

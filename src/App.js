import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TemplatePage from './pages/TemplatePage';
import ScalePage from './pages/ScalePage';
import EditorPage from './pages/EditorPage';
import ExportPage from './pages/ExportPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<TemplatePage />} />
        <Route path="/scale" element={<ScalePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/export" element={<ExportPage />} />
      </Routes>
    </Router>
  );
}

export default App;

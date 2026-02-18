import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Identity from './pages/Identity.jsx';
import WorksheetEntry from './pages/WorksheetEntry.jsx';
import History from './pages/History.jsx';
import ExportCenter from './pages/ExportCenter.jsx';

const useIdentity = () => {
    try {
        const raw = localStorage.getItem('ws_identity');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
};

const PrivateRoute = ({ children }) => {
    const identity = useIdentity();
    return identity ? children : <Navigate to="/identity" replace />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/identity" element={<Identity />} />
                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                    <Route index element={<Navigate to="/entry" replace />} />
                    <Route path="entry" element={<WorksheetEntry />} />
                    <Route path="history" element={<History />} />
                    <Route path="export" element={<ExportCenter />} />
                </Route>
                <Route path="*" element={<Navigate to="/entry" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

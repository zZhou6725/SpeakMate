import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PracticeRoom from './pages/PracticeRoom';
import History from './pages/History';
import Report from './pages/Report';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/home" element={<Dashboard />} />
        <Route path="/practice" element={<PracticeRoom />} />
        <Route path="/history" element={<History />} />
        <Route path="/report" element={<Report />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Layout>
  );
}
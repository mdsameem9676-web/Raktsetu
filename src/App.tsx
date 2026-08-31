import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Unauthorized } from './pages/Unauthorized';
import { ProtectedRoute } from './components/ProtectedRoute';
import { 
  UserDashboard,
  DonorDashboard, 
  ReceiverDashboard, 
  HospitalDashboard, 
  AdminDashboard 
} from './pages/Dashboards';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Dashboard Pages */}
        <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/donor/dashboard" element={<DonorDashboard />} />
          <Route path="/receiver/dashboard" element={<ReceiverDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['HOSPITAL']} />}>
          <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

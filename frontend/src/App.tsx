import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Admin/Dashboard';
import Products from './pages/Admin/Products';
import Categories from './pages/Admin/Categories';
import Orders from './pages/Admin/Orders';
import UsersPage from './pages/Admin/UsersPage';
import ComplaintsPage from './pages/Admin/ComplaintsPage';
import SettingsPage from './pages/Admin/SettingsPage';
import AddProduct from './pages/Admin/AddProduct';
import AccountProfile from './pages/Admin/AccountProfile';
import HelpCenter from './pages/Admin/HelpCenter';
import ReportsPage from './pages/Admin/ReportsPage';
import Register from './pages/Admin/Register';
import VouchersPage from './pages/Admin/VouchersPage';

export default function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#af101a', fontFamily: 'Inter' } }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<AddProduct />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<Orders />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="vouchers" element={<VouchersPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="account" element={<AccountProfile />} />
            <Route path="help" element={<HelpCenter />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}



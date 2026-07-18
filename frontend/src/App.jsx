import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Track from './pages/Track.jsx';
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import DashboardLayout from './pages/dashboard/DashboardLayout.jsx';
import Overview from './pages/dashboard/Overview.jsx';
import Products from './pages/dashboard/Products.jsx';
import Inventory from './pages/dashboard/Inventory.jsx';
import Orders from './pages/dashboard/Orders.jsx';
import RiderLayout from './pages/rider/RiderLayout.jsx';
import Available from './pages/rider/Available.jsx';
import Active from './pages/rider/Active.jsx';
import History from './pages/rider/History.jsx';

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
      <Route path="/track" element={<PublicLayout><Track /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="admin">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="orders" element={<Orders />} />
      </Route>

      <Route
        path="/rider"
        element={
          <ProtectedRoute role="rider">
            <RiderLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Available />} />
        <Route path="active" element={<Active />} />
        <Route path="history" element={<History />} />
      </Route>
    </Routes>
  );
}

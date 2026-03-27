import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Marketplace from './pages/Marketplace';
import Jobs from './pages/Jobs';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ProductDetail from './pages/ProductDetail';
import Sell from './pages/Sell';
import JobDetail from './pages/JobDetail';
import PostJob from './pages/PostJob';
import Analytics from './pages/Analytics';
import CreateProduct from './pages/CreateProduct';
import PurchaseSuccess from './pages/PurchaseSuccess';
import PurchaseCancel from './pages/PurchaseCancel';

function App() {
  const { loadUser } = useAuthStore();
  useEffect(() => {
    loadUser();
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/job/:id" element={<JobDetail />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/create-product" element={<CreateProduct />} />
        <Route path="/purchase-success" element={<PurchaseSuccess />} />
        <Route path="/purchase-cancel" element={<PurchaseCancel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

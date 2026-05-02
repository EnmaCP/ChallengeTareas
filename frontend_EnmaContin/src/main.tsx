import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { UserProvider } from './context/UserContext.tsx'
import Header from './components/Header.tsx'
import ProductDetail from './components/ProductDetail.tsx'
import NotFound from './components/NotFound.tsx'
import CheckoutPage from './components/CheckoutPage.tsx'
import IntranetLayout from './components/IntranetLayout.tsx'
import IntranetHome from './components/IntranetHome.tsx'
import ClockInPage from './components/ClockInPage.tsx'
import ClockHistory from './components/ClockHistory.tsx'
import OrderHistory from './components/OrderHistory.tsx'
import AdminUsers from './components/AdminUsers.tsx'
import LoginPage from './components/LoginPage.tsx'
import RegisterPage from './components/RegisterPage.tsx'
import PrivateRoute from './components/PrivateRoute.tsx'
import OrdersPanel from './components/OrdersPanel.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="/mis-pedidos" element={<PrivateRoute><OrderHistory /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute roles={["admin"]}><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/orders" element={<PrivateRoute roles={["admin", "employee"]}><OrdersPanel /></PrivateRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/intranet" element={<PrivateRoute roles={["employee", "admin"]}><IntranetLayout /></PrivateRoute>}>
            <Route index element={<IntranetHome />} />
            <Route path="fichajes" element={<ClockInPage />} />
            <Route path="historico" element={<ClockHistory />} />
            <Route path="pedidos" element={<OrderHistory />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  </StrictMode>,
)

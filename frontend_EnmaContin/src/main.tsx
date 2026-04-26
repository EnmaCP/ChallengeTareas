import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Header from './components/Header.tsx'
import ProductDetail from './components/ProductDetail.tsx'
import NotFound from './components/NotFound.tsx'
import CheckoutPage from './components/CheckoutPage.tsx'
import IntranetLayout from './components/IntranetLayout.tsx'
import IntranetHome from './components/IntranetHome.tsx'
import ClockInPage from './components/ClockInPage.tsx'
import ClockHistory from './components/ClockHistory.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/intranet" element={<IntranetLayout />}>
          <Route index element={<IntranetHome />} />
          <Route path="fichajes" element={<ClockInPage />} />
          <Route path="historico" element={<ClockHistory />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

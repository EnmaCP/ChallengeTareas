import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { CartItem } from "../types";

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [completedCart, setCompletedCart] = useState<CartItem[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = sessionStorage.getItem("cart");
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, []);

  const handleCompleteOrder = async () => {
    if (!address.trim()) return;
    setError(null);

    const orderPayload = {
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: Number(item.product.price),
      })),
      address: address.trim(),
    };

    try {
      const response = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (response.ok || response.status === 201) {
        setCompletedCart(cart);
        sessionStorage.removeItem("cart");
        setCart([]);
        setSuccessMessage(data.message || "Pedido completado con éxito");
        if (data.order && data.order.id) {
          setOrderId(data.order.id);
        }
      } else {
        setError(data.error || "Ocurrió un error al procesar el pedido.");
      }
    } catch (err) {
      setError("Error de red al procesar el pedido.");
    }
  };

  if (successMessage) {
    const totalPrice = completedCart?.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0) || 0;

    return (
      <div className="checkout-page">
        <h2>{successMessage}</h2>
        {orderId && <p>Número de pedido: {orderId}</p>}
        
        {completedCart && completedCart.length > 0 && (
          <div className="order-summary-success" style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'left' }}>
            <h3 style={{ marginTop: 0 }}>Resumen de tu pedido</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {completedCart.map((item) => (
                <li key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>{item.quantity}x {item.product.name}</span>
                  <span>{(Number(item.product.price) * item.quantity).toFixed(2)} €</span>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <span>Total pagado:</span>
              <span>{totalPrice.toFixed(2)} €</span>
            </div>
            {address && (
              <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#555' }}>
                <strong>Enviado a:</strong> {address}
              </div>
            )}
          </div>
        )}

        <button onClick={() => navigate("/")} style={{ marginTop: '20px' }}>Volver a la tienda</button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <h2>Tu carrito está vacío</h2>
        <button onClick={() => navigate("/")}>Volver a la tienda</button>
      </div>
    );
  }

  const totalPrice = cart.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0);

  return (
    <div className="checkout-page">
      <h2>Resumen del Pedido</h2>
      <ul>
        {cart.map((item) => (
          <li key={item.product.id} className="checkout-item">
            <span><strong>{item.product.name}</strong></span>
            <span>Cantidad: {item.quantity}</span>
            <span>Subtotal: {(Number(item.product.price) * item.quantity).toFixed(2)} €</span>
          </li>
        ))}
      </ul>
      <h3>Total: {totalPrice.toFixed(2)} €</h3>

      <div className="address-section" style={{ marginTop: '20px', marginBottom: '20px' }}>
        <label htmlFor="address" style={{ display: 'block', marginBottom: '5px' }}>Dirección de envío:</label>
        <input
          type="text"
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ej. Calle Mayor 12, Madrid"
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>

      {error && <p className="error" style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      <div className="actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={() => navigate("/")}>&larr; Volver al carrito</button>
        <button
          onClick={handleCompleteOrder}
          disabled={!address.trim()}
          style={{
            cursor: !address.trim() ? 'not-allowed' : 'pointer',
            opacity: !address.trim() ? 0.6 : 1
          }}
        >
          Completar pedido
        </button>
      </div>
    </div>
  );
}

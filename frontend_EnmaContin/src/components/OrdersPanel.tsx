import { useState, useEffect } from "react";

const STATUS_COLORS: Record<string, string> = {
  pending: "orange",
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
};

export default function OrdersPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/orders", {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error al obtener los pedidos:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchOrders();
      } else {
        console.error("Error al actualizar el estado");
      }
    } catch (error) {
      console.error("Error de red al actualizar el estado:", error);
    }
  };

  if (loading) return <p>Cargando panel de pedidos...</p>;

  if (orders.length === 0) {
    return <p>No hay pedidos en el sistema.</p>;
  }

  return (
    <div className="orders-panel" style={{ padding: '20px' }}>
      <h2>Panel de Gestión de Pedidos</h2>
      <table className="orders-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px' }}>#</th>
            <th style={{ padding: '10px' }}>Cliente (id)</th>
            <th style={{ padding: '10px' }}>Estado</th>
            <th style={{ padding: '10px' }}>Total</th>
            <th style={{ padding: '10px' }}>Dirección</th>
            <th style={{ padding: '10px' }}>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr 
              key={order.id} 
              style={{ borderBottom: '1px solid #eee' }}
              className="order-row"
            >
              <td style={{ padding: '10px' }}>{order.id}</td>
              <td style={{ padding: '10px' }}>{order.customer_id}</td>
              <td style={{ padding: '10px' }}>
                <select 
                  value={order.status || 'pending'} 
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  style={{ 
                    color: STATUS_COLORS[order.status?.toLowerCase()] || 'black', 
                    fontWeight: 'bold',
                    padding: '5px'
                  }}
                >
                  <option value="pending" style={{ color: STATUS_COLORS.pending }}>pending</option>
                  <option value="processing" style={{ color: STATUS_COLORS.processing }}>processing</option>
                  <option value="shipped" style={{ color: STATUS_COLORS.shipped }}>shipped</option>
                  <option value="delivered" style={{ color: STATUS_COLORS.delivered }}>delivered</option>
                  <option value="cancelled" style={{ color: STATUS_COLORS.cancelled }}>cancelled</option>
                </select>
              </td>
              <td style={{ padding: '10px' }}>{Number(order.total).toFixed(2)} €</td>
              <td style={{ padding: '10px' }}>{order.address}</td>
              <td style={{ padding: '10px' }}>{new Date(order.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useState, useEffect } from "react";

const STATUS_COLORS: Record<string, string> = {
  pending: "orange",
  processing: "blue",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const userStr = sessionStorage.getItem("user");
      if (!userStr) {
        setLoading(false);
        return;
      }
      
      let userId;
      try {
        const userObj = JSON.parse(userStr);
        userId = userObj.id || userStr;
      } catch (e) {
        userId = userStr;
      }

      if (userId) {
        try {
          const res = await fetch(`http://localhost:3000/api/orders/customer/${userId}`);
          if (res.ok) {
            const data = await res.json();
            setOrders(data);
          }
        } catch (error) {
          console.error("Error al obtener los pedidos:", error);
        }
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const handleRowClick = async (orderId: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data);
      }
    } catch (error) {
      console.error("Error al obtener el detalle del pedido:", error);
    }
  };

  if (loading) return <p>Cargando pedidos...</p>;

  if (orders.length === 0) {
    return <p>No hay pedidos todavía.</p>;
  }

  return (
    <div className="order-history" style={{ padding: '20px' }}>
      <h2>Historial de Pedidos</h2>
      <table className="orders-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px' }}>#</th>
            <th style={{ padding: '10px' }}>Estado</th>
            <th style={{ padding: '10px' }}>Total</th>
            <th style={{ padding: '10px' }}>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr 
              key={order.id} 
              onClick={() => handleRowClick(order.id)} 
              style={{ cursor: 'pointer', borderBottom: '1px solid #eee' }}
              className="order-row"
            >
              <td style={{ padding: '10px' }}>{order.id}</td>
              <td style={{ 
                padding: '10px', 
                color: STATUS_COLORS[order.status?.toLowerCase()] || 'black', 
                fontWeight: 'bold' 
              }}>
                {order.status || 'pending'}
              </td>
              <td style={{ padding: '10px' }}>{Number(order.total).toFixed(2)} €</td>
              <td style={{ padding: '10px' }}>{new Date(order.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrder && (
        <div className="order-details" style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Detalle del Pedido #{selectedOrder.id}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {selectedOrder.items?.map((item: any, index: number) => (
              <li key={index} style={{ marginBottom: '10px', borderBottom: '1px dotted #ccc', paddingBottom: '5px' }}>
                <strong>{item.name}</strong> <br/>
                Cantidad: {item.quantity} | Precio unitario: {Number(item.unit_price).toFixed(2)} € | Subtotal: {Number(item.subtotal).toFixed(2)} €
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

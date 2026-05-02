import { Outlet, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function IntranetLayout() {
  const { customer: user, setCustomer } = useUser();

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3000/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch(e) {}
    setCustomer(null);
  };

  return (
    <div className="intranet-layout">
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <h2>Intranet</h2>
        <div>
          <span style={{ marginRight: '15px' }}>Hola, {user?.username ?? 'empleado'}</span>
          <button 
            onClick={handleLogout} 
            style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>
      <nav style={{ padding: '0.5rem 1rem', backgroundColor: '#e9ecef', borderBottom: '1px solid #ddd' }}>
        <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><Link to="/intranet">Bienvenida</Link></li>
          <li><Link to="/intranet/fichajes">Fichajes</Link></li>
          <li><Link to="/intranet/historico">Histórico</Link></li>
          <li><Link to="/intranet/pedidos">Pedidos</Link></li>
        </ul>
      </nav>
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

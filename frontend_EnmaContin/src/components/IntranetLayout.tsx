import { Outlet, Link } from 'react-router-dom';

export default function IntranetLayout() {
  const raw = sessionStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  return (
    <div className="intranet-layout">
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <h2>Intranet</h2>
        <div>
          <span>Hola, {user?.username ?? 'empleado'}</span>
        </div>
      </header>
      <nav style={{ padding: '0.5rem 1rem', backgroundColor: '#e9ecef', borderBottom: '1px solid #ddd' }}>
        <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><Link to="/intranet">Bienvenida</Link></li>
          <li><Link to="/intranet/fichajes">Fichajes</Link></li>
          <li><Link to="/intranet/historico">Histórico</Link></li>
        </ul>
      </nav>
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

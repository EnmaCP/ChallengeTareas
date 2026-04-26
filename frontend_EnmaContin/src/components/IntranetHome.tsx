import { Link } from 'react-router-dom';

export default function IntranetHome() {
  const raw = sessionStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  return (
    <div>
      <h2>Bienvenido a la Intranet</h2>
      <p>Hola, {user?.username ?? 'empleado'}, ¿qué deseas hacer hoy?</p>
      <div style={{ marginTop: '1rem' }}>
        <Link 
          to="/intranet/fichajes" 
          style={{ padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}
        >
          Ir a Fichajes
        </Link>
      </div>
    </div>
  );
}

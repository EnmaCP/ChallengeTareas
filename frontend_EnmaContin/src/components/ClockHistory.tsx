import { useState, useEffect } from 'react';

type HistoryRecord = {
  date: string;
  in: string | null;
  out: string | null;
};

export default function ClockHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const raw = sessionStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  const employeeId = user?.id ?? 1;

  useEffect(() => {
    fetch(`http://localhost:3000/api/clock/history?employeeId=${employeeId}`)
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al obtener historial:", err);
        setLoading(false);
      });
  }, [employeeId]);

  if (loading) return <div>Cargando historial...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginTop: 0, color: '#333', marginBottom: '1.5rem' }}>Histórico de Fichajes</h2>
      
      {history.length === 0 ? (
        <p>No hay fichajes registrados.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {history.map((record, index) => {
            const isComplete = record.in && record.out;
            return (
              <li 
                key={index} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '1rem', 
                  marginBottom: '0.5rem', 
                  borderRadius: '4px',
                  backgroundColor: isComplete ? '#d4edda' : '#f8d7da',
                  color: isComplete ? '#155724' : '#721c24',
                  border: `1px solid ${isComplete ? '#c3e6cb' : '#f5c6cb'}`
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{record.date}</div>
                <div>
                  <span style={{ marginRight: '1rem' }}>
                    Entrada: <strong>{record.in || '--:--'}</strong>
                  </span>
                  <span>
                    Salida: <strong>{record.out || '--:--'}</strong>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

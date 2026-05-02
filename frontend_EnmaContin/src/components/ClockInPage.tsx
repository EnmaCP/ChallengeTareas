import { useState, useEffect } from 'react';

export default function ClockInPage() {
  const [isClockedIn, setIsClockedIn] = useState<boolean | null>(null);
  const [note, setNote] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:3000/api/clock/status`, { 
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setIsClockedIn(data.isClockedIn);
      })
      .catch(err => console.error("Error al obtener estado de fichaje:", err));
  }, []);

  const handleClockEvent = async () => {
    const type = isClockedIn ? "out" : "in";

    try {
      const response = await fetch("http://localhost:3000/api/clock", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ type, note }),
      });

      if (response.ok) {
        const data = await response.json();
        const eventTime = new Date(data.event.recorded_at || Date.now()).toLocaleTimeString();
        
        setIsClockedIn(!isClockedIn);
        setNote('');
        setConfirmationMessage(`Has fichado la ${type === 'in' ? 'entrada' : 'salida'} a las ${eventTime}`);
        
        setTimeout(() => setConfirmationMessage(null), 5000);
      } else {
        console.error("Error al registrar fichaje");
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  if (isClockedIn === null) return <div>Cargando estado...</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>Fichajes</h2>
      
      {confirmationMessage && (
        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #c3e6cb' }}>
          {confirmationMessage}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="note" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>
          Incidencia / Nota (Opcional):
        </label>
        <textarea
          id="note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej: Llegada tarde por tráfico..."
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
        />
      </div>

      <button
        onClick={handleClockEvent}
        style={{ 
          width: '100%', 
          padding: '0.75rem', 
          fontSize: '1rem', 
          fontWeight: 'bold', 
          color: 'white', 
          backgroundColor: isClockedIn ? '#dc3545' : '#28a745', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer' 
        }}
      >
        {isClockedIn ? 'Fichar salida' : 'Fichar entrada'}
      </button>
    </div>
  );
}

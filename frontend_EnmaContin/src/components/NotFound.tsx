import { useNavigate } from "react-router-dom";
import "./not-found.css";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found">
        <h1>404</h1>
        <h2>Página no encontrada</h2>
        <p>Lo sentimos, la ruta a la que intentas acceder no existe o fue movida.</p>
        <button onClick={() => navigate("/")} className="back-button">
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default NotFound;

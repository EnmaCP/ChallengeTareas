import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

interface Props {
  children: ReactNode;
  roles?: string[]; // si se omite, solo exige estar autenticado
}

export default function PrivateRoute({ children, roles }: Props) {
  const { customer, loading } = useUser();

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Cargando sesión...</div>;
  }

  if (!customer) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(customer.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

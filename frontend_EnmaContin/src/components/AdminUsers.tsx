import { useEffect, useState } from "react";
import type { User } from "../types";

interface AdminUser extends User {
  active: boolean;
  full_name: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3000/api/admin/users", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Error al obtener usuarios");
        }

        const data = await response.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (
    userId: number,
    newRole: string
  ): Promise<void> => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/admin/users/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al cambiar el rol");
      }

      const data = await response.json();
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: data.user.role } : user
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error:", err);
    }
  };

  const handleStatusChange = async (userId: number): Promise<void> => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/admin/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ active: !user.active }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al cambiar el estado");
      }

      const data = await response.json();
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, active: data.user.active } : u
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Panel de Administración de Usuarios</h1>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "2px solid #ddd" }}>
            <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>
              ID
            </th>
            <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>
              Nombre
            </th>
            <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>
              Email
            </th>
            <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>
              Rol Actual
            </th>
            <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>
              Estado
            </th>
            <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #ddd" }}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px" }}>{user.id}</td>
              <td style={{ padding: "10px" }}>{user.full_name || user.username}</td>
              <td style={{ padding: "10px" }}>{user.email}</td>
              <td style={{ padding: "10px" }}>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  style={{
                    padding: "5px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <option value="customer">customer</option>
                  <option value="employee">employee</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td style={{ padding: "10px" }}>
                <span
                  style={{
                    padding: "5px 10px",
                    borderRadius: "4px",
                    backgroundColor: user.active ? "#4CAF50" : "#f44336",
                    color: "white",
                    fontSize: "12px",
                  }}
                >
                  {user.active ? "Activo" : "Suspendido"}
                </span>
              </td>
              <td style={{ padding: "10px" }}>
                <button
                  onClick={() => handleStatusChange(user.id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: user.active ? "#f44336" : "#4CAF50",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  {user.active ? "Suspender" : "Reactivar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

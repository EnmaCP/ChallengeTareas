import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import type { Product } from "./types.js";
import { pool } from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { NextFunction } from "express";
import cookieParser from "cookie-parser";

const JWT_SECRET = process.env.JWT_SECRET ?? "mi_secreto_secretoso_2026";

const app = express();
const PORT = 3000;


app.use(cors());
app.use(express.json());

interface AuthRequest extends Request {
    customer?: {
        id: number;
        username: string;
        role: string;
    }
}

const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ error: "Token no proporcionado o formato inválido" })
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Token no proporcionado" })
    }

    try {
        const payLoad = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string }
        req.customer = {
            id: payLoad.id,
            username: payLoad.username,
            role: payLoad.role
        }
        next();

    }
    catch (error) {
        res.status(401).json({ error: "token invalido" })
    }
};

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

app.get("/", (req: Request, res: Response) => {
    res.send("Backend de la tienda funcionando");
});

app.get("/api/hello", (req: Request, res: Response) => {
    res.json({ message: "Hola desde el backend" });
});


app.get("/api/test", async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
        const result2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'order_items'");
        res.json({ connected: true, orders_columns: result.rows, order_items_columns: result2.rows });
    } catch (error) {
        console.error("Error connecting to database:", error);
        res.status(500).json({ connected: false, error: "Database connection failed" });
    }
});

app.get("/api/products", async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT * FROM products WHERE deleted_at IS NULL AND active = TRUE ORDER BY id"
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los productos" });
    }
});

app.get("/api/products/inactive", async (req: Request, res: Response) => {
    const inactives = await pool.query("SELECT * FROM products WHERE active = FALSE AND deleted_at IS NULL");


    if (inactives.rows.length === 0) {
        return res.status(404).json({
            error: "No hay productos inactivos"
        });
    }

    res.json(
        inactives.rows
    )

});

app.get("/api/products/:id", async (req: Request<{ id: string }>, res: Response) => {
    const result = await pool.query(
        "SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL AND active = TRUE",
        [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);

});

app.post("/api/products", verifyToken, async (req: Request<{}, {}, Product>, res: Response) => {
    const { name, description, price, category, stock, image_url } = req.body;
    if (!name || !price) {
        return res.status(400).json({ error: "Nombre y precio son obligatorios" });
    }
    const user = (req as AuthRequest).customer;
    if (!user || user.role !== "admin" && user.role !== "employee") {
        return res.status(403).json({ error: "No tienes permiso para realizar esta acción" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO products (name, description, price, category, stock, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [name, description, price, category, stock, image_url]
        );
        res.status(201).json({ message: "Producto añadido correctamente", product: result.rows[0] });

    } catch (error) {
        res.status(500).json({ error: "Error al guardar el producto en la base de datos" });
    }

});

app.put("/api/products/:id", async (req, res) => {
    const { id } = req.params;

    const { name, description, price, category, stock, image_url } = req.body;

    try {
        const result = await pool.query(
            `UPDATE products 
            SET name = COALESCE($1, name), 
                description = COALESCE($2, description), 
                price = COALESCE($3, price), 
                category = COALESCE($4, category), 
                stock = COALESCE($5, stock), 
                image_url = COALESCE($6, image_url) 
            WHERE id = $7 
            RETURNING *`,
            [name, description, price, category, stock, image_url, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el producto" });
    }
});

app.patch("/api/products/:id/toggle", async (req: Request<{ id: string }>, res: Response) => {
    const result = await pool.query(
        "UPDATE products SET active = NOT active WHERE id = $1 AND deleted_at IS NULL RETURNING *",
        [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "producto no encontrado" });
    }

    const p = result.rows[0];

    res.json({
        message: p.active ? "Producto activado" : "Producto desactivado",
        product: p
    });
});



app.delete("/api/products/:id", async (req: Request<{ id: string }>, res: Response) => {
    const inOrders = await pool.query("SELECT * FROM order_items WHERE product_id = $1 LIMIT 1", [req.params.id]);

    if (inOrders.rows.length > 0) {
        const result = await pool.query(
            `UPDATE products
        SET deleted_at = NOW()
        WHERE id = $1
        AND deleted_at IS NULL
        RETURNING *`,
            [parseInt(req.params.id)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }
        return res.json({
            message: "Producto eliminado (soft) correctamente",
            product: result.rows[0]
        });
    }
    //HARD DELETE
    const result = await pool.query(
        `DELETE FROM products
        WHERE id = $1
        RETURNING *`,
        [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            error: "Producto no encontrado"
        });
    }
    res.json({
        message: "Producto eliminado (harder)",
        product: result.rows[0]
    });


}
);

app.get("/api/orders", async (req: Request, res: Response) => {
    const orders = await pool.query(`
        SELECT o.id, o.status, o.created_at, o.address, COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `);
    res.json(orders.rows);
});

app.get("/api/orders/:id", async (req: Request<{ id: string }>, res: Response) => {
    const orderId = Number(req.params.id);

    const orderResult = await pool.query(`
        SELECT o.id, o.status, o.created_at, o.address, COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id
    `, [orderId]);

    if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: "Pedido no encontrado" });
    }
    const items = await pool.query(
        `SELECT oi.quantity, oi.unit_price, (oi.quantity * oi.unit_price) as subtotal, p.name, p.image_url 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`, [orderId]
    );
    res.json({ ...orderResult.rows[0], items: items.rows });
});

app.get("/api/orders/customer/:customerId", async (req: Request<{ customerId: string }>, res: Response) => {
    const customerId = Number(req.params.customerId);
    const orders = await pool.query(`
        SELECT o.id, o.status, o.created_at, o.address, COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `, [customerId]);
    res.json(orders.rows);
});

app.post("/api/orders", async (req: Request<{}, {}, {
    items: { product_id: number; quantity: number, unit_price: number }[];
    address: string
}>, res: Response) => {
    const { items, address } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: "La orden debe tener al menos un producto" });
    }

    if (!address) {
        return res.status(400).json({
            error: "La direccion de envío es obligatoria"

        });
    }


    for (const item of items) {
        if (!item.product_id || item.unit_price <= 0 || item.quantity <= 0) {
            return res.status(400).json({ error: "Cada item debe tener un product_id y unºa cantidad mayor a 0" });


        }
        const productResult = await pool.query(
            "SELECT stock, price FROM products WHERE id = $1 AND deleted_at IS NULL",
            [item.product_id]
        )

        if (productResult.rows.length === 0) {
            return res.status(400).json({ error: `Producto con id ${item.product_id} no encontrado` });
        }

        if (productResult.rows[0].stock < item.quantity) {
            return res.status(409).json({ error: `No hay suficiente stock para el producto con id ${item.product_id}` });
        }

        if (productResult.rows[0].price != item.unit_price) {
            return res.status(400).json({ error: `El precio unitario del producto con id ${item.product_id} ha cambiado` });
        }
    }

    const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const orderResult = await client.query(
            "INSERT INTO orders (customer_id, address) VALUES ($1, $2) RETURNING *",
            [1, address]
        );
        const orderId = orderResult.rows[0].id;
        for (const item of items) {
            await client.query(
                "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
                [orderId, item.product_id, item.quantity, item.unit_price]
            );
            await client.query(
                "UPDATE products SET stock = stock - $1 WHERE id = $2",
                [item.quantity, item.product_id]
            );
        }

        await client.query("COMMIT");
        res.status(201).json({ message: "Pedido creado correctamente", order: { id: orderId, total, address } });
    } catch (error) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: "Error al crear el pedido: " + (error as any).message });
    } finally {
        client.release();
    }

});

app.get("/api/clock/status", async (req: Request, res: Response) => {
    const employeeId = req.query.employeeId;
    if (!employeeId) {
        return res.status(400).json({ error: "Id de empleado requerido" });
    }

    try {
        const result = await pool.query(
            "SELECT type FROM clock_events WHERE employee_id = $1 ORDER BY recorded_at DESC LIMIT 1",
            [Number(employeeId)]
        );

        const isClockedIn = result.rows.length > 0 && result.rows[0].type === 'in';
        res.json({ isClockedIn });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener estado de fichaje" });
    }
});

app.post("/api/clock", async (req: Request, res: Response) => {
    const { employeeId, type, note } = req.body;

    if (!employeeId || !type) {
        return res.status(400).json({ error: "Id de empleado y tipo son requeridos" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO clock_events (employee_id, type, note) VALUES ($1, $2, $3) RETURNING *",
            [employeeId, type, note || null]
        );
        res.status(201).json({ event: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar fichaje" });
    }
});

app.get("/api/clock/history", async (req: Request, res: Response) => {
    const employeeId = req.query.employeeId;
    if (!employeeId) {
        return res.status(400).json({ error: "Id de empleado requerido" });
    }

    try {
        const eventsResult = await pool.query(
            "SELECT * FROM clock_events WHERE employee_id = $1 ORDER BY recorded_at ASC",
            [Number(employeeId)]
        );

        const history: Record<string, { date: string, sortKey: number, in: string | null, out: string | null }> = {};

        for (const event of eventsResult.rows) {
            const dateObj = new Date(event.recorded_at);
            const dateStr = dateObj.toLocaleDateString('es-ES');

            if (!history[dateStr]) {
                history[dateStr] = { date: dateStr, sortKey: dateObj.getTime(), in: null, out: null };
            }

            const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            if (event.type === 'in') {
                if (!history[dateStr].in) history[dateStr].in = timeStr;
            } else if (event.type === 'out') {
                history[dateStr].out = timeStr; // last out overrides
            }
        }

        const historyArray = Object.values(history)
            .sort((a, b) => b.sortKey - a.sortKey)
            .map(({ date, in: inTime, out }) => ({ date, in: inTime, out }));

        res.json(historyArray);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener historial" });
    }
});

app.post("/api/auth/register", async (req: Request<{}, {}, {
    username: string;
    email: string;
    password: string;
    full_name: string;
}>, res: Response) => {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password)
        return res.status(400).json({ error: "username, email y password son obligatorios" });

    const existing = await pool.query(
        "SELECT 1 FROM customers WHERE username=$1 OR email=$2",
        [username, email]
    )

    if (existing.rows.length > 0) {
        return res.status(409).json({ error: "El username o email ya está en uso" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
        "INSERT INTO customers (username, email, password, full_name,role) VALUES ($1, $2, $3, $4, 'client')RETURNING id,username,email,full_name,role",
        [username, email, hashPassword, full_name]
    );

    res.status(201).json({ message: "Usuario creado correctamente", user: result.rows[0] });
});

app.post("/api/auth/login", async (req: Request<{}, {}, {
    email: string;
    password: string;
}>, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: "email y password son obligatorios" });

    const result = await pool.query(
        "SELECT * FROM customers WHERE email=$1 ",
        [email]
    )

    if (result.rows.length === 0) {
        return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
        return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "2h" }
    );

    res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 2 * 60 * 60 * 1000 }) //edad maxima en milisegundos lol
    res.json({ message: "Login exitoso", user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name, email: user.email } })
});

// Admin endpoints para gestión de usuarios
app.get("/api/admin/users", verifyToken, async (req: AuthRequest, res: Response) => {
    if (req.customer?.role !== "admin") {
        return res.status(403).json({ error: "Solo administradores pueden acceder a esta ruta" });
    }

    try {
        const result = await pool.query(
            "SELECT id, username, email, full_name, role, active FROM customers ORDER BY id"
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

app.patch("/api/admin/users/:id/role", verifyToken, async (req: Request<{ id: string }, {}, { role: string }>, res: Response) => {
    const authReq = req as AuthRequest;
    if (authReq.customer?.role !== "admin") {
        return res.status(403).json({ error: "Solo administradores pueden acceder a esta ruta" });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["customer", "employee", "admin"].includes(role)) {
        return res.status(400).json({ error: "Rol inválido. Debe ser: customer, employee o admin" });
    }

    try {
        const result = await pool.query(
            "UPDATE customers SET role = $1 WHERE id = $2 RETURNING id, username, email, role, active",
            [role, parseInt(id)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json({ message: "Rol actualizado correctamente", user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el rol del usuario" });
    }
});

app.patch("/api/admin/users/:id/status", verifyToken, async (req: Request<{ id: string }, {}, { active: boolean }>, res: Response) => {
    const authReq = req as AuthRequest;
    if (authReq.customer?.role !== "admin") {
        return res.status(403).json({ error: "Solo administradores pueden acceder a esta ruta" });
    }

    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
        return res.status(400).json({ error: "El estado debe ser un booleano" });
    }

    try {
        const result = await pool.query(
            "UPDATE customers SET active = $1 WHERE id = $2 RETURNING id, username, email, role, active",
            [active, parseInt(id)]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json({ message: "Estado del usuario actualizado correctamente", user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el estado del usuario" });
    }
});
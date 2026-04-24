import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import type { Product } from "./types.js";
import { pool } from "./db.js";

const app = express();
const PORT = 3000;

//export const products: Product[] = [
//{ id: 1, name: "Camiseta Unboxing", description: "Camiseta negra con diseño retro de unboxing.", price: 19.99, category: "Ropa", stock: 50, imageURL: "https://placehold.co/200x200?text=Camiseta" },
//{ id: 2, name: "Taza Bug Hunter", description: "Taza blanca con mensaje para programadores.", price: 12.50, category: "Cocina", stock: 30, imageURL: "https://placehold.co/200x200?text=Taza" },
//{ id: 3, name: "Funda Dark Mode", description: "Funda para móvil con diseño minimalista.", price: 15.00, category: "Accesorios", stock: 20, imageURL: "https://placehold.co/200x200?text=Funda" },
//{ id: 4, name: "Sudadera npm ci", description: "Sudadera gris con eslogan de desarrollo.", price: 35.00, category: "Ropa", stock: 15, imageURL: "https://placehold.co/200x200?text=Sudadera" },
//{ id: 5, name: "Sticker Pack Dev", description: "Set de 10 stickers con iconos tech.", price: 5.99, category: "Papelería", stock: 100, imageURL: "https://placehold.co/200x200?text=Stickers" }
//];

app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

app.get("/", (req: Request, res: Response) => {
    res.send("Backend de la tienda funcionando");
});

app.get("/api/hello", (req: Request, res: Response) => {
    res.json({ message: "Hola desde el backend" });
});

//app.get("/api/products", (req: Request, res: Response) => {
//    res.json(products);
//});

//app.get("/api/products/:id", (req: Request<{ id: string }>, res: Response) => {
//    const id = parseInt(req.params.id);
//    const product = products.find((p) => p.id === id);

//    if (!product) {
//        return res.status(404).json({ error: "Producto no encontrado " });
//    }

//    res.json(product);
//});

//app.post("/api/products", (req: Request<{}, {}, {
//    name: string; description?: string; price: number;
//    category?: string; stock?: number; image_url?: string;
//}>, res: Response) => {
//    const { name, description, price, category, stock, image_url } = req.body || {};

//    if (!name) {
//        return res.status(400).json({ error: "Nombre es obligatorio" });
//    }

//    if (price <= 0 || price === undefined) {
//        return res.status(400).json({ error: "El precio debe ser mayor a 0" });
//    }

//    if (stock !== undefined && stock < 0) {
//        return res.status(400).json({ error: "El stock debe ser mayor o igual a 0" });
//    }

// const newProduct: Product = {
//     id: products.length + 1,
//     name: name,
//     description: description ?? "",
//     price: price,
//     category: category ?? "General",
//     stock: stock ?? 0,
//     imageURL: image_url ?? `https://placehold.co/200x200?text=${encodeURIComponent(name)}`
// };

// products.push(newProduct);
// res.status(201).json({ message: "Producto añadido correctamente", product: newProduct });


//});

//app.put("/api/products/:id", (req: Request<{ id: string }, {}, { stock: number }>, res: Response) => {
//    const id = parseInt(req.params.id);
//    const { stock } = req.body || {};

//    const product = products.find((p) => p.id === id);

//    if (!product) {
//        return res.status(404).json({ error: "Producto no encontrado " });
//    }

//    if (stock === undefined || stock < 0) {
//        return res.status(400).json({ error: "El stock debe ser mayor o igual a 0" });
//    }

//    product.stock = stock;


//    res.json({ message: "Producto actualizado correctamente", product });
//}
//);


//app.delete(
//    "/api/products/:id",
//    (req: Request<{ id: string }>, res: Response) => {
//        const id = parseInt(req.params.id);


//        const index = products.findIndex((p) => p.id === id);

//        if (index === -1) {
//            return res.status(404).json({ error: "Producto no encontrado " });
//        }

//        const deleted = products[index];
//        products.splice(index, 1);
//        res.json({ message: "Producto eliminado correctamente", product: deleted });
//    }
//);

app.get("/api/test", async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ connected: true, time: result.rows[0].now });
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

app.get("/api/products/inactive", async(req: Request, res: Response) => {
    const inactives = await pool.query("SELECT * FROM products WHERE active = FALSE AND deleted_at IS NULL" );


    if (inactives.rows.length === 0) {
            return res.status(404).json({
                error: "No hay productos inactivos"
            });
        }

    res.json(
        inactives.rows
    )

});

app.get("/api/products/:id", async (req: Request <{id: string}>, res: Response) => {
    const result = await pool.query(
        "SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL AND active = TRUE",
        [parseInt(req.params.id)]
    );

    if(result.rows.length === 0){
        return res.status(404).json({error: "Producto no encontrado"});
    }
    
    res.json(result.rows[0]);

    });

app.post("/api/products", async (req: Request<{}, {}, Product>, res: Response) => {
    const { name, description, price, category, stock, image_url } = req.body;
    if (!name || !price) {
        return res.status(400).json({ error: "Nombre y precio son obligatorios" });
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
            SET name = $1, description = $2, price = $3, category = $4, stock = $5, image_url = $6 
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

app.patch("/api/products/:id/toggle", async (req: Request<{id: string}>, res: Response) =>{
    const result = await pool.query(
        "UPDATE products SET active = NOT active WHERE id = $1 AND deleted_at IS NULL RETURNING *",
        [parseInt(req.params.id)]
    );
    
    if(result.rows.length === 0){
        return res.status(404).json ({error: "producto no encontrado"});
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

app.get("/api/orders" , async (req: Request, res: Response) => {
    const orders = await pool.query("SELECT o.id, o.status, o.total, o.created_at, o.address FROM orders o ORDER BY o.created_at DESC");
    res.json(orders.rows);
});

app.get("/api/orders/:id", async (req: Request<{id: string}>, res: Response) => {
    const orderId = Number(req.params.id);

    const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderResult.rows.length === 0) {
        return res.status(404).json({ error: "Pedido no encontrado" });
    }
    const items = await pool.query(
        `SELECT * FROM order_items o WHERE o.order_id = $1`, [orderId]
    );
    res.json({...orderResult.rows[0], items: items.rows });
});

app.post("/api/orders", async (req: Request<{}, {}, { 
    items: { product_id: number; quantity: number, unit_price: number }[]; 
    address: string }>, res: Response) => {
const { items, address } = req.body;

if(!items||items.length === 0){
    return res.status(400).json({ error: "La orden debe tener al menos un producto" });
}

if(!address){
    return res.status(400).json({ error: "La direccion de envío es obligatoria" 
    
    });
}

for (const item of items) {
    if(!item.product_id || item.unit_price <= 0 || item.quantity <= 0){
        return res.status(400).json({ error: "Cada item debe tener un product_id y unºa cantidad mayor a 0" });
    

    }
    const productResult = await pool.query(
        "SELECT stock, unit_price FROM products WHERE id = $1 AND deleted_at IS NULL",
        [item.product_id]
    )

    if(productResult.rows.length === 0){
        return res.status(400).json({ error: `Producto con id ${item.product_id} no encontrado` });
    }

    if(productResult.rows[0].stock < item.quantity){
        return res.status(400).json({ error: `No hay suficiente stock para el producto con id ${item.product_id}` });
    }

    if(productResult.rows[0].unit_price != item.unit_price){
        return res.status(400).json({ error: `El precio unitario del producto con id ${item.product_id} ha cambiado` });
    }
}

const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

const client = await pool.connect();
try {
    await client.query("BEGIN");

    const orderResult = await client.query(
        "INSERT INTO orders (total, address) VALUES ($1, $2) RETURNING *",
        [total, address]
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
    res.status(500).json({ error: "Error al crear el pedido" });
} finally {
    client.release();
}

});

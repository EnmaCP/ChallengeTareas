import { pool } from "../src/db.js";

async function runQuery() {
    const res = await pool.query("SELECT id, customer_id, address, created_at FROM orders ORDER BY created_at DESC LIMIT 5");
    console.log(res.rows);
    process.exit(0);
}

runQuery();

import { pool } from "../src/db.js";

async function runQuery() {
    try {
        const result = await pool.query(
            "INSERT INTO clock_events (employee_id, type, note) VALUES ($1, $2, $3) RETURNING *",
            [3, 'in', 'test note']
        );
        console.log(result.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

runQuery();

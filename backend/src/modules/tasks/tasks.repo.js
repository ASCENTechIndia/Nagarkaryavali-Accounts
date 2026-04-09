const pool = require("../../config/db");

async function findAll() {
  const r = await pool.query("SELECT * FROM tasks ORDER BY id DESC");
  return r.rows;
}

async function create(title) {
  const r = await pool.query(
    "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
    [title]
  );
  return r.rows[0];
}

async function toggle(id) {
  const r = await pool.query(
    "UPDATE tasks SET is_done = NOT is_done WHERE id=$1 RETURNING *",
    [id]
  );
  return r.rows[0] || null;
}

async function remove(id) {
  const r = await pool.query("DELETE FROM tasks WHERE id=$1", [id]);
  return r.rowCount > 0;
}

module.exports = { findAll, create, toggle, remove };

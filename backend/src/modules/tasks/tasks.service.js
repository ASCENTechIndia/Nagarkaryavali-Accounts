const repo = require("./tasks.repo");
const { AppError } = require("../../libs/errors");

async function getAll() {
  return repo.findAll();
}

async function addTask(title) {
  return repo.create(title);
}

async function toggleTask(id) {
  const updated = await repo.toggle(id);
  if (!updated) throw new AppError("Task not found", 404);
  return updated;
}

async function deleteTask(id) {
  const ok = await repo.remove(id);
  if (!ok) throw new AppError("Task not found", 404);
  return true;
}

module.exports = { getAll, addTask, toggleTask, deleteTask };


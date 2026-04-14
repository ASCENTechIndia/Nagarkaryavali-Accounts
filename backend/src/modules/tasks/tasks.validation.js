const { z } = require("zod");

const createTaskSchema = z.object({
  title: z.string().min(1, "title is required").max(200),
});

module.exports = { createTaskSchema };

import { z } from "zod";



///No need of this file for now
/**
 * Recursively unwrap a Zod schema until we reach ZodObject
 * Works with ZodEffects, Optional, Default, etc.
 */
const unwrapToObject = (schema) => {
  let current = schema;

  while (current) {
    if (current instanceof z.ZodObject) {
      return current;
    }

    if (current instanceof z.ZodEffects) {
      current = current._def.schema;
      continue;
    }

    if (
      current instanceof z.ZodOptional ||
      current instanceof z.ZodDefault
    ) {
      current = current._def.innerType;
      continue;
    }

    break;
  }

  return null;
};

export const getRequiredFields = (zodSchema) => {
  const objectSchema = unwrapToObject(zodSchema);

  if (!objectSchema) {
    throw new Error(
      "getRequiredFields: Could not resolve ZodObject from schema"
    );
  }

  const shape = objectSchema.shape;
  const requiredMap = {};

  for (const key in shape) {
    const field = shape[key];

    requiredMap[key] = !(
      field instanceof z.ZodOptional ||
      field instanceof z.ZodDefault
    );
  }

  return requiredMap;
};

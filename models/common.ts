import type { SchemaDefinition, SchemaOptions } from 'mongoose'

/**
 * Every orderable content type shares these two fields:
 *  - `order`    drives drag-to-reorder in the admin (ascending)
 *  - `published` is the draft/published toggle; the public site only ever
 *    queries `{ published: true }`.
 */
export const orderableFields = {
  order: { type: Number, default: 0, index: true },
  published: { type: Boolean, default: true, index: true },
} satisfies SchemaDefinition

export const baseOptions: SchemaOptions = {
  timestamps: true,
  // Keep documents lean and predictable when converted with `.lean()`.
  minimize: false,
  versionKey: false,
}

/** Singleton documents are addressed by this constant key. */
export const SINGLETON_KEY = 'singleton'

export const singletonFields = {
  key: {
    type: String,
    default: SINGLETON_KEY,
    unique: true,
    immutable: true,
  },
} satisfies SchemaDefinition

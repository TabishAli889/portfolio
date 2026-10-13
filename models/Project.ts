import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'
import { baseOptions, orderableFields } from './common'

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
      match: [SLUG_PATTERN, 'Slug must be lowercase words separated by hyphens'],
    },
    summary: { type: String, default: '', trim: true, maxlength: 400 },
    /** Long-form body for /projects/[slug]. Rendered as sanitised markdown. */
    description: { type: String, default: '', maxlength: 20000 },
    techTags: { type: [String], default: [] },
    imageUrl: { type: String, default: '', trim: true, maxlength: 600 },
    imageAlt: { type: String, default: '', trim: true, maxlength: 240 },
    liveUrl: { type: String, default: '', trim: true, maxlength: 600 },
    githubUrl: { type: String, default: '', trim: true, maxlength: 600 },
    featured: { type: Boolean, default: false, index: true },
    role: { type: String, default: '', trim: true, maxlength: 140 },
    year: { type: String, default: '', trim: true, maxlength: 40 },
    highlights: { type: [String], default: [] },
    ...orderableFields,
  },
  baseOptions,
)

export type ProjectDoc = InferSchemaType<typeof ProjectSchema>

export const Project: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc>) ?? model<ProjectDoc>('Project', ProjectSchema)

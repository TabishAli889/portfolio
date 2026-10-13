import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'
import { baseOptions, orderableFields } from './common'

const ExperienceSchema = new Schema(
  {
    role: { type: String, required: true, trim: true, maxlength: 140 },
    company: { type: String, required: true, trim: true, maxlength: 140 },
    companyUrl: { type: String, default: '', trim: true, maxlength: 400 },
    location: { type: String, default: '', trim: true, maxlength: 140 },
    employmentType: { type: String, default: '', trim: true, maxlength: 60 },
    /** Free-text so the admin is not forced into a date picker, e.g. Jun 2025. */
    startDate: { type: String, default: '', trim: true, maxlength: 60 },
    endDate: { type: String, default: '', trim: true, maxlength: 60 },
    current: { type: Boolean, default: false },
    bullets: { type: [String], default: [] },
    techTags: { type: [String], default: [] },
    ...orderableFields,
  },
  baseOptions,
)

export type ExperienceDoc = InferSchemaType<typeof ExperienceSchema>

export const Experience: Model<ExperienceDoc> =
  (models.Experience as Model<ExperienceDoc>) ??
  model<ExperienceDoc>('Experience', ExperienceSchema)

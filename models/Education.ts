import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'
import { baseOptions, orderableFields } from './common'

const EducationSchema = new Schema(
  {
    degree: { type: String, required: true, trim: true, maxlength: 180 },
    institution: { type: String, required: true, trim: true, maxlength: 180 },
    location: { type: String, default: '', trim: true, maxlength: 140 },
    startDate: { type: String, default: '', trim: true, maxlength: 60 },
    endDate: { type: String, default: '', trim: true, maxlength: 60 },
    current: { type: Boolean, default: false },
    grade: { type: String, default: '', trim: true, maxlength: 80 },
    description: { type: String, default: '', trim: true, maxlength: 1200 },
    ...orderableFields,
  },
  baseOptions,
)

export type EducationDoc = InferSchemaType<typeof EducationSchema>

export const Education: Model<EducationDoc> =
  (models.Education as Model<EducationDoc>) ??
  model<EducationDoc>('Education', EducationSchema)

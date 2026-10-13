import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'
import { baseOptions, orderableFields } from './common'

const CertificationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    issuer: { type: String, default: '', trim: true, maxlength: 160 },
    issueDate: { type: String, default: '', trim: true, maxlength: 60 },
    credentialId: { type: String, default: '', trim: true, maxlength: 160 },
    credentialUrl: { type: String, default: '', trim: true, maxlength: 600 },
    imageUrl: { type: String, default: '', trim: true, maxlength: 600 },
    ...orderableFields,
  },
  baseOptions,
)

export type CertificationDoc = InferSchemaType<typeof CertificationSchema>

export const Certification: Model<CertificationDoc> =
  (models.Certification as Model<CertificationDoc>) ??
  model<CertificationDoc>('Certification', CertificationSchema)

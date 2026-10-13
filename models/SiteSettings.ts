import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'
import { baseOptions, singletonFields } from './common'

const SiteSettingsSchema = new Schema(
  {
    ...singletonFields,
    siteName: { type: String, default: 'Your Name', trim: true, maxlength: 120 },
    tagline: { type: String, default: '', trim: true, maxlength: 240 },
    seoTitle: { type: String, default: '', trim: true, maxlength: 160 },
    seoDescription: { type: String, default: '', trim: true, maxlength: 320 },
    /** Cloudinary secure_url of the resume PDF. */
    resumeUrl: { type: String, default: '', trim: true, maxlength: 600 },
    resumeFileName: { type: String, default: 'resume.pdf', trim: true, maxlength: 160 },
    email: { type: String, default: '', trim: true, maxlength: 200 },
    location: { type: String, default: '', trim: true, maxlength: 160 },
    ogImageUrl: { type: String, default: '', trim: true, maxlength: 600 },
    footerNote: { type: String, default: '', trim: true, maxlength: 240 },
  },
  baseOptions,
)

export type SiteSettingsDoc = InferSchemaType<typeof SiteSettingsSchema>

export const SiteSettings: Model<SiteSettingsDoc> =
  (models.SiteSettings as Model<SiteSettingsDoc>) ??
  model<SiteSettingsDoc>('SiteSettings', SiteSettingsSchema)

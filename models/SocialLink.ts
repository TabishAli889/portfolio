import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'
import { baseOptions, orderableFields } from './common'

const SocialLinkSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 80 },
    url: { type: String, required: true, trim: true, maxlength: 600 },
    /** lucide-react icon name, e.g. Github. */
    icon: { type: String, default: 'Link', trim: true, maxlength: 60 },
    ...orderableFields,
  },
  baseOptions,
)

export type SocialLinkDoc = InferSchemaType<typeof SocialLinkSchema>

export const SocialLink: Model<SocialLinkDoc> =
  (models.SocialLink as Model<SocialLinkDoc>) ??
  model<SocialLinkDoc>('SocialLink', SocialLinkSchema)

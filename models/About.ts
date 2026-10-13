import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'
import { baseOptions, singletonFields } from './common'

const AboutSchema = new Schema(
  {
    ...singletonFields,
    heading: { type: String, default: 'About me', trim: true, maxlength: 120 },
    /** Rendered as separate <p> elements, in order. */
    paragraphs: { type: [String], default: [] },
    imageUrl: { type: String, default: '', trim: true, maxlength: 600 },
    /** Small stat chips, e.g. { label: 'Based in', value: 'Lahore, PK' }. */
    facts: {
      type: [
        {
          _id: false,
          label: { type: String, trim: true, maxlength: 80 },
          value: { type: String, trim: true, maxlength: 120 },
        },
      ],
      default: [],
    },
  },
  baseOptions,
)

export type AboutDoc = InferSchemaType<typeof AboutSchema>

export const About: Model<AboutDoc> =
  (models.About as Model<AboutDoc>) ?? model<AboutDoc>('About', AboutSchema)

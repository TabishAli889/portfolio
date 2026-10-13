import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'
import { baseOptions, singletonFields } from './common'

const HeroSchema = new Schema(
  {
    ...singletonFields,
    greeting: { type: String, default: '', trim: true, maxlength: 120 },
    name: { type: String, default: '', trim: true, maxlength: 120 },
    /** Rotated by the typewriter effect in the hero. */
    roles: { type: [String], default: [] },
    tagline: { type: String, default: '', trim: true, maxlength: 400 },
    /** Portrait shown beside the hero text. */
    imageUrl: { type: String, default: '', trim: true, maxlength: 600 },
    imageAlt: { type: String, default: '', trim: true, maxlength: 240 },
    primaryCtaLabel: { type: String, default: 'View my work', trim: true, maxlength: 60 },
    primaryCtaHref: { type: String, default: '#projects', trim: true, maxlength: 300 },
    secondaryCtaLabel: { type: String, default: 'Get in touch', trim: true, maxlength: 60 },
    secondaryCtaHref: { type: String, default: '#contact', trim: true, maxlength: 300 },
    showResumeButton: { type: Boolean, default: true },
  },
  baseOptions,
)

export type HeroDoc = InferSchemaType<typeof HeroSchema>

export const Hero: Model<HeroDoc> =
  (models.Hero as Model<HeroDoc>) ?? model<HeroDoc>('Hero', HeroSchema)

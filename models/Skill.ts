import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'
import { baseOptions, orderableFields } from './common'

const SkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'SkillCategory',
      required: true,
      index: true,
    },
    /** 0-100, drives the animated proficiency bar. */
    level: { type: Number, default: 80, min: 0, max: 100 },
    icon: { type: String, default: '', trim: true, maxlength: 60 },
    ...orderableFields,
  },
  baseOptions,
)

export type SkillDoc = InferSchemaType<typeof SkillSchema>

export const Skill: Model<SkillDoc> =
  (models.Skill as Model<SkillDoc>) ?? model<SkillDoc>('Skill', SkillSchema)

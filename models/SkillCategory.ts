import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'
import { baseOptions, orderableFields } from './common'

const SkillCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    /** lucide-react icon name, e.g. "Code2". */
    icon: { type: String, default: '', trim: true, maxlength: 60 },
    description: { type: String, default: '', trim: true, maxlength: 240 },
    ...orderableFields,
  },
  baseOptions,
)

export type SkillCategoryDoc = InferSchemaType<typeof SkillCategorySchema>

export const SkillCategory: Model<SkillCategoryDoc> =
  (models.SkillCategory as Model<SkillCategoryDoc>) ??
  model<SkillCategoryDoc>('SkillCategory', SkillCategorySchema)

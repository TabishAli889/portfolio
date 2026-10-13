import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'
import { baseOptions } from './common'

const MessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    read: { type: Boolean, default: false, index: true },
    /** Delivery bookkeeping: the row is written before the email is attempted. */
    emailSent: { type: Boolean, default: false },
    emailError: { type: String, default: '', maxlength: 600 },
    ip: { type: String, default: '', maxlength: 80 },
    userAgent: { type: String, default: '', maxlength: 400 },
  },
  baseOptions,
)

MessageSchema.index({ createdAt: -1 })

export type MessageDoc = InferSchemaType<typeof MessageSchema>

export const Message: Model<MessageDoc> =
  (models.Message as Model<MessageDoc>) ?? model<MessageDoc>('Message', MessageSchema)

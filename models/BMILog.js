import mongoose from 'mongoose'

const BMILogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    weight: { type: Number, required: true }, // in kg
    height: { type: Number, required: true }, // in cm
    bmi: { type: Number, required: true },
    category: { type: String, required: true },
    advice: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
)

export default mongoose.models.BMILog ||
  mongoose.model('BMILog', BMILogSchema)

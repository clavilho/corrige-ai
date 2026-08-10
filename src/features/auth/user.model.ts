import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  googleId: { type: String, unique: true, sparse: true, index: true },
  avatarUrl: { type: String },
}, { timestamps: true });

export type User = InferSchemaType<typeof userSchema>;
export const UserModel: Model<User> = models.User ?? model<User>("User", userSchema);

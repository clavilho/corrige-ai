import mongoose from "mongoose";

declare global {
  var mongoConnection: Promise<typeof mongoose> | undefined;
}

export function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("A variável MONGODB_URI não foi configurada.");
  if (!global.mongoConnection) {
    global.mongoConnection = mongoose.connect(uri, { dbName: process.env.MONGODB_DB ?? "corrige_ai" });
  }
  return global.mongoConnection;
}

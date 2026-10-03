import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) throw new Error("Please define MONGODB_URI in .env.local")

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }

// Survives dev hot reloads and warm serverless invocations.
const globalForMongoose = globalThis as typeof globalThis & { mongoose?: MongooseCache }
const cached: MongooseCache = (globalForMongoose.mongoose ??= { conn: null, promise: null })

export async function connectDB() {
  if (cached.conn) return cached.conn
  cached.promise ??= mongoose.connect(MONGODB_URI, {
    // Serverless instances each hold a pool; keep it small so Atlas isn't exhausted.
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  })
  try {
    cached.conn = await cached.promise
  } catch (e) {
    // Drop the failed attempt so the next request retries instead of failing forever.
    cached.promise = null
    throw e
  }
  return cached.conn
}

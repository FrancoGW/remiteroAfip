import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

/**
 * Global es usado aquí para mantener una instancia cacheada de la conexión
 * entre hot reloads en desarrollo. Esto previene que se creen múltiples conexiones
 * durante el desarrollo de Next.js.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      "Por favor define la variable de entorno MONGODB_URI en .env.local"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
    cached.promise.then(() => {
      console.log("✅ Conectado a MongoDB");
    }).catch((err) => {
      console.error("❌ Error conectando a MongoDB:", err);
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

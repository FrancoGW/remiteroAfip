const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://admin:admin@cluster0.5deof2h.mongodb.net/remitero?retryWrites=true&w=majority";

const UsuarioSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin", enum: ["admin", "user"] },
}, { timestamps: true });

const Usuario = mongoose.models.Usuario || mongoose.model("Usuario", UsuarioSchema);

async function createAdminUser() {
  try {
    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    const username = "admin";
    const password = "admin123QWE!";

    // Verificar si el usuario ya existe
    const existingUser = await Usuario.findOne({ username });
    if (existingUser) {
      console.log("⚠️  El usuario 'admin' ya existe en la base de datos");
      console.log("💡 Si quieres actualizar la contraseña, elimina el usuario primero");
      process.exit(0);
    }

    // Hashear contraseña
    console.log("🔐 Hasheando contraseña...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    console.log("👤 Creando usuario admin...");
    const usuario = await Usuario.create({
      username,
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Usuario creado exitosamente:");
    console.log(`   Username: ${usuario.username}`);
    console.log(`   Role: ${usuario.role}`);
    console.log(`   ID: ${usuario._id}`);

    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createAdminUser();

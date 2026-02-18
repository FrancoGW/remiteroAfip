import bcrypt from "bcryptjs";
import connectDB from "../db/mongodb";
import UsuarioModel from "../db/models/Usuario";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: {
    username: string;
    role: string;
  };
}

/**
 * Servicio de autenticación
 */
export class AuthService {
  /**
   * Verifica las credenciales de un usuario
   */
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      await connectDB();

      const { username, password } = credentials;

      // Buscar usuario por username
      const usuario = await UsuarioModel.findOne({ username: username.toLowerCase() });

      if (!usuario) {
        return {
          success: false,
          message: "Usuario o contraseña incorrectos",
        };
      }

      // Verificar contraseña
      const passwordMatch = await bcrypt.compare(password, usuario.password);

      if (!passwordMatch) {
        return {
          success: false,
          message: "Usuario o contraseña incorrectos",
        };
      }

      return {
        success: true,
        user: {
          username: usuario.username,
          role: usuario.role || "admin",
        },
      };
    } catch (error: any) {
      console.error("Error en login:", error);
      return {
        success: false,
        message: "Error al procesar el login",
      };
    }
  }

  /**
   * Crea un nuevo usuario (para administración)
   */
  static async createUser(username: string, password: string, role: string = "admin"): Promise<AuthResult> {
    try {
      await connectDB();

      // Verificar si el usuario ya existe
      const existingUser = await UsuarioModel.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        return {
          success: false,
          message: "El usuario ya existe",
        };
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const usuario = await UsuarioModel.create({
        username: username.toLowerCase(),
        password: hashedPassword,
        role,
      });

      return {
        success: true,
        user: {
          username: usuario.username,
          role: usuario.role || "admin",
        },
      };
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      return {
        success: false,
        message: "Error al crear el usuario",
      };
    }
  }
}

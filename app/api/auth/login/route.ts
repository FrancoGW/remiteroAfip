import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/authService";

/**
 * POST /api/auth/login
 * Endpoint para autenticación de usuarios
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuario y contraseña son requeridos",
        },
        { status: 400 }
      );
    }

    const result = await AuthService.login({ username, password });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 401 }
      );
    }

    // Crear respuesta exitosa
    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    // En producción, aquí podrías establecer un token JWT en una cookie
    // Por ahora, usamos una cookie simple para mantener la sesión
    response.cookies.set("auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 horas
    });

    response.cookies.set("username", result.user?.username || "", {
      httpOnly: false, // Para que el frontend pueda leerlo
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 horas
    });

    return response;
  } catch (error: any) {
    console.error("Error en login:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al procesar el login",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/logout
 * Endpoint para cerrar sesión
 */
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Sesión cerrada",
  });

  // Eliminar cookies
  response.cookies.delete("auth");
  response.cookies.delete("username");

  return response;
}

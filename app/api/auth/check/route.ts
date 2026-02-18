import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/check
 * Verifica si el usuario está autenticado
 */
export async function GET(request: NextRequest) {
  const authCookie = request.cookies.get("auth");
  const usernameCookie = request.cookies.get("username");

  if (authCookie?.value === "true" && usernameCookie?.value) {
    return NextResponse.json({
      success: true,
      authenticated: true,
      username: usernameCookie.value,
    });
  }

  return NextResponse.json({
    success: false,
    authenticated: false,
  });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const cookieStore = cookies();

  // Obtener cookies con await
  const accessToken = await cookieStore.get("access_token")?.value;
  const userDataCookie = await cookieStore.get("user_data")?.value;

  // Rutas públicas
  const publicPaths = ["/login"];

  // Permitir acceso a rutas públicas
  if (publicPaths.includes(pathname)) {
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie);
        const roleRoutes = {
          1: "/administrador",
          2: "/encargado",
          3: "/facilitador",
        };
        const targetRoute = roleRoutes[userData.rol_id];
        if (targetRoute) {
          return NextResponse.redirect(new URL(targetRoute, request.url));
        }
      } catch (error) {
        console.error("Error procesando datos de usuario:", error);
      }
    }
    return NextResponse.next();
  }

  // Si no hay datos de usuario, redirigir a login
  if (!userDataCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const userData = JSON.parse(userDataCookie);
    const roleRoutes = {
      1: "/administrador",
      2: "/encargado",
      3: "/facilitador",
    };

    // Redirigir desde la raíz
    if (pathname === "/") {
      const targetRoute = roleRoutes[userData.rol_id];
      if (targetRoute) {
        return NextResponse.redirect(new URL(targetRoute, request.url));
      }
    }

    // Verificar acceso a rutas según rol
    const userBaseRoute = roleRoutes[userData.rol_id];
    if (userBaseRoute && !pathname.startsWith(userBaseRoute)) {
      return NextResponse.redirect(new URL(userBaseRoute, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error de autenticación:", error);
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("access_token");
    response.cookies.delete("user_data");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

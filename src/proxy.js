import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const userDataCookie = request.cookies.get("user_data")?.value;

  // Rutas publicas
  const publicPaths = ["/login"];

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

    if (pathname === "/") {
      const targetRoute = roleRoutes[userData.rol_id];
      if (targetRoute) {
        return NextResponse.redirect(new URL(targetRoute, request.url));
      }
    }

    const userBaseRoute = roleRoutes[userData.rol_id];
    if (userBaseRoute && !pathname.startsWith(userBaseRoute)) {
      return NextResponse.redirect(new URL(userBaseRoute, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error de autenticacion:", error);
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("access_token");
    response.cookies.delete("user_data");
    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|logo_alcaldia.jpg).*)"],
};

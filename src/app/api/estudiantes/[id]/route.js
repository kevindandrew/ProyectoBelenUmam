import { NextResponse } from "next/server";

const API_URL = "https://api-umam-1.onrender.com";

export async function DELETE(request, { params }) {
  const resolvedParams = await params;
  const estudianteId = resolvedParams?.id;
  const authHeader = request.headers.get("authorization");

  if (!estudianteId) {
    return NextResponse.json(
      { message: "ID de estudiante no proporcionado" },
      { status: 400 },
    );
  }

  if (!authHeader) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const urls = [
    `${API_URL}/estudiantes/${estudianteId}`,
    `${API_URL}/estudiantes/${estudianteId}/`,
  ];

  let lastNetworkError = null;
  let lastHttpError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          authorization: authHeader,
          "content-type": "application/json",
        },
        cache: "no-store",
      });

      const responseBody = await response.text();
      const contentType =
        response.headers.get("content-type") || "application/json";

      if (response.ok) {
        return new NextResponse(responseBody, {
          status: response.status,
          headers: {
            "content-type": contentType,
          },
        });
      }

      // Guardar el último error HTTP y continuar con la URL alternativa.
      lastHttpError = {
        status: response.status,
        body: responseBody,
        contentType,
      };
      continue;
    } catch (error) {
      lastNetworkError = error;
    }
  }

  if (lastHttpError) {
    const hasBody =
      typeof lastHttpError.body === "string" &&
      lastHttpError.body.trim() !== "";

    return new NextResponse(
      hasBody
        ? lastHttpError.body
        : JSON.stringify({
            message:
              "El servidor no pudo eliminar el estudiante en este momento.",
          }),
      {
        status: lastHttpError.status,
        headers: {
          "content-type": hasBody
            ? lastHttpError.contentType
            : "application/json",
        },
      },
    );
  }

  return NextResponse.json(
    {
      message:
        "No se pudo conectar con el servidor de estudiantes. Intenta nuevamente.",
      details: lastNetworkError?.message || "Unknown network error",
    },
    { status: 502 },
  );
}

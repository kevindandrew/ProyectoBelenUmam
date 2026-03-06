# Sistema de Gestión de Sesión Expirada

Este proyecto incluye un sistema automático para detectar y manejar sesiones expiradas (tokens JWT vencidos).

## Componentes

### 1. SessionExpiredModal

Modal que se muestra cuando la sesión expira. Incluye:

- Icono de advertencia
- Mensaje informativo
- Botón para redirigir al login

Ubicación: `src/components/SessionExpiredModal.jsx`

### 2. SessionProvider

Contexto de React que provee:

- `handleSessionExpired()`: Función para mostrar el modal manualmente
- `authenticatedFetch()`: Función fetch que detecta automáticamente errores 401

Ubicación: `src/components/SessionProvider.jsx`

### 3. ClientProviders

Wrapper de cliente que incluye el SessionProvider.

Ubicación: `src/components/ClientProviders.jsx`

## Uso

### Opción 1: Usar authenticatedFetch (Recomendado)

En cualquier componente client, importa el hook `useSession`:

```javascript
"use client";
import { useSession } from "@/components/SessionProvider";

export default function MiComponente() {
  const { authenticatedFetch } = useSession();

  const fetchData = async () => {
    try {
      const response = await authenticatedFetch(
        "https://api-umam-1.onrender.com/usuarios",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Error en la petición");
      }

      const data = await response.json();
      // ... procesar datos
    } catch (error) {
      // Si el error es "Sesión expirada", el modal ya se mostró automáticamente
      if (error.message !== "Sesión expirada") {
        console.error("Error:", error);
      }
    }
  };

  // ...
}
```

### Opción 2: Usar fetch normal y detectar manualmente

Si prefieres usar fetch normal, puedes detectar manualmente los errores 401:

```javascript
"use client";
import { useSession } from "@/components/SessionProvider";
import Cookies from "js-cookie";

export default function MiComponente() {
  const { handleSessionExpired } = useSession();

  const fetchData = async () => {
    try {
      const token = Cookies.get("access_token");

      const response = await fetch("https://api-umam-1.onrender.com/usuarios", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        throw new Error("Error en la petición");
      }

      const data = await response.json();
      // ... procesar datos
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // ...
}
```

## Funcionamiento

1. Cuando una petición retorna un error 401 (Unauthorized):
   - Se limpian las cookies (access_token, user_data)
   - Se muestra el modal de sesión expirada
   - El usuario debe hacer clic para volver al login

2. El SessionProvider está integrado en el layout principal, por lo que está disponible en toda la aplicación.

3. El modal aparece de forma no intrusiva con un backdrop oscuro y se centra en la pantalla.

## Migración de código existente

Para actualizar código existente que usa fetch directamente:

**Antes:**

```javascript
const token = Cookies.get("access_token");
const response = await fetch(url, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

**Después:**

```javascript
const { authenticatedFetch } = useSession();
const response = await authenticatedFetch(url, {
  // headers adicionales si los necesitas
});
```

## Notas

- El token se extrae automáticamente de las cookies en `authenticatedFetch`
- No necesitas verificar manualmente si el token existe
- El modal se cierra automáticamente al redirigir al login
- Puedes seguir usando fetch normal si prefieres, solo necesitas llamar a `handleSessionExpired()` cuando detectes un 401

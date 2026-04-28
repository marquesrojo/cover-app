# COVER App — Guía de activación Beta
## De cero a funcionando en ~30 minutos

---

## PASO 1 — Crear proyecto en Supabase (5 min)

1. Entrá a **supabase.com** → Sign up (gratis)
2. Hacé clic en **New project**
3. Nombre: `cover-grupoaislar`
4. Elegí una contraseña segura para la base de datos (guardala)
5. Región: **South America (São Paulo)** — la más cercana a Argentina
6. Hacé clic en **Create new project** y esperá ~2 minutos

---

## PASO 2 — Ejecutar el schema SQL (3 min)

1. En tu proyecto de Supabase, hacé clic en **SQL Editor** (ícono de base de datos)
2. Hacé clic en **New query**
3. Abrí el archivo `SUPABASE_SCHEMA.sql` que descargaste
4. Seleccioná TODO el contenido (Ctrl+A) y copialo
5. Pegalo en el editor de Supabase
6. Hacé clic en **Run** (botón verde)
7. Deberías ver: `Success. No rows returned`

---

## PASO 3 — Obtener las credenciales (2 min)

1. En Supabase, andá a **Settings → API**
2. Copiá los dos valores:
   - **Project URL** → empieza con `https://`
   - **anon public** key → string largo que empieza con `eyJ`

---

## PASO 4 — Subir el código a GitHub (5 min)

1. Creá un nuevo repositorio en github.com → nombre: `cover-app`
2. Subí todos los archivos de la carpeta `cover-app` que descargaste
   - Importante: la carpeta `src` va completa con su estructura interna

---

## PASO 5 — Publicar en Vercel con variables de entorno (5 min)

1. En **vercel.com** → Add New → Project → importá `cover-app`
2. **ANTES de hacer Deploy**, expandí **Environment Variables**
3. Agregá las dos variables:

   | Nombre | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | La URL que copiaste en el paso 3 |
   | `VITE_SUPABASE_ANON_KEY` | La anon key que copiaste en el paso 3 |

4. Ahora sí: hacé clic en **Deploy**
5. En ~2 minutos tenés la URL

---

## PASO 6 — Configurar autenticación en Supabase (3 min)

1. En Supabase → **Authentication → URL Configuration**
2. En **Site URL** pegá la URL de tu app en Vercel (ej: `https://cover-app.vercel.app`)
3. En **Redirect URLs** agregá la misma URL
4. Hacé clic en **Save**

> Esto es necesario para que los emails de confirmación funcionen correctamente.

---

## PASO 7 — Primer acceso (2 min)

1. Abrí la URL de tu app
2. Hacé clic en **Registrarse**
3. Ingresá tu nombre, email y contraseña
4. Revisá tu email y confirmá la cuenta
5. Iniciá sesión

---

## ¡Listo! La app está en beta operativa.

### Funcionalidades activas:
- ✅ Login y registro con email
- ✅ Crear plantas/instalaciones
- ✅ Gemelo digital con grilla 10m × 10m editable
- ✅ Inspecciones con fotos reales guardadas
- ✅ Cada inspección tiene URL única para compartir
- ✅ Tickets editables con estados (Abierto → En Proceso → Resuelto)
- ✅ Dashboard con datos reales y botón actualizar
- ✅ SLA de 30 días para tickets críticos

### Para invitar usuarios beta:
Simplemente compartí la URL. Cada persona se registra con su email.
En Supabase → Authentication → Users podés ver todos los usuarios registrados.

---

## Solución de problemas frecuentes

| Problema | Solución |
|---|---|
| "Missing Supabase environment variables" | Verificar que las variables estén en Vercel Settings |
| No llega el email de confirmación | Revisar spam, o en Supabase → Authentication → deshabilitar confirmación temporalmente |
| Error al subir fotos | Verificar que el SQL del schema se ejecutó completo (storage buckets) |
| Dashboard vacío | Normal al inicio — crear primera planta desde Gemelo Digital |

---

*COVER App — Grupo Aislar · Beta v1.0*

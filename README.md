# VE·LOBBY — Canal de contenidos en tiempo real

Webapp para emitir contenido online: **videos y tutoriales** (YouTube, TikTok, Instagram…) en un
**reproductor con cola automática**, más **banners publicitarios, anuncios en cinta, aplicaciones,
códigos/cupones y notas**. Todo lo que publica el administrador se sincroniza **al instante en
todos los dispositivos** gracias a Supabase Realtime.

- **Lobby público** → `https://mayfrend-app.github.io/ve/`
- **Panel de administración** → acceso solo para el administrador con el botón **"Continuar con Google"**.

---

## 1 · Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "VE Lobby"
git branch -M main
git remote add origin https://github.com/mayfrend-app/ve.git
git push -u origin main
```

## 2 · Configurar Supabase (una sola vez)

1. Entra a tu proyecto en [supabase.co](https://supabase.co).
2. **SQL Editor → New query** → pega y ejecuta todo el archivo [`supabase/schema.sql`](supabase/schema.sql).
   Esto crea las tablas `content` y `admins`, las políticas de seguridad (RLS) y activa el
   **Realtime** para la tabla `content`.
3. **Authentication → Providers → Google**: activa el proveedor
   (necesitas un OAuth Client ID de Google Cloud Console; usa el callback que ya tienes:
   `https://vhlqrwrkgpycybptowtn.supabase.co/auth/v1/callback`).
4. **Authentication → URL Configuration → Redirect URLs**: agrega
   - `https://mayfrend-app.github.io/ve/`
   - `http://localhost:5173` (para desarrollo local)

### Credenciales

El proyecto lee la URL y la clave **publishable** desde el archivo `.env` (ya incluido; esa clave
es pública por diseño de Supabase y segura para el navegador).

> ⚠️ **Importante:** la contraseña de la base de datos y la *service role key* **jamás** deben
> subir al repositorio ni usarse en la webapp. Como la contraseña se compartió en un chat,
> te recomendamos **rotarla** en Supabase → Settings → Database.

## 3 · Primer inicio de sesión (registro del admin)

1. Abre la web → botón **"Acceso admin"** → **"Continuar con Google"**.
2. Como la tabla `admins` está vacía, **la primera cuenta de Google que inicia sesión queda
   registrada automáticamente como administradora**.
3. Las siguientes cuentas serán rechazadas salvo que un admin las agregue:
   ```sql
   insert into public.admins (email) values ('otro_admin@gmail.com');
   ```

## 4 · Deploy en GitHub Pages (`mayfrend-app.github.io/ve`)

1. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
2. Cada `git push` a `main` ejecuta el workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
   que compila con `--base=/ve/` y publica automáticamente.
3. Tu web queda en **https://mayfrend-app.github.io/ve** 🎉

## 5 · Desarrollo local

```bash
npm install
npm run dev   # http://localhost:5173
```

---

## Cómo funciona

| Pieza | Detalle |
|---|---|
| `src/lib/supabase.ts` | Cliente de Supabase (credenciales por `.env`) |
| `src/hooks/useContent.ts` | Datos + suscripción a **Realtime** (`postgres_changes` de `content`) |
| `src/components/Player.tsx` | Reproductor YouTube (IFrame API) con **cola automática**, mute y cartelera |
| `src/components/Admin.tsx` | CRUD completo: crear, editar, activar/ocultar, reordenar y eliminar |
| `supabase/schema.sql` | Tablas, RLS y Realtime. La primera sesión de Google se vuelve admin |

Si la base aún no está configurada, la webapp funciona en **modo demostración** con contenido de
ejemplo y te avisa con una guía de conexión en el panel.

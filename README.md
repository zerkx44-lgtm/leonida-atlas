# Leonida Atlas: mapa interactivo de fans para GTA VI

Es una página web que también se instala como app en el celular (PWA, en Android y en iPhone). Incluye:

- **Mapa ilustrado de Leonida** con sus 6 regiones (Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia y Mount Kalaga). Es un dibujo propio, no el arte del juego.
- **90 puntos** tomados de guías públicas de la comunidad: autos raros y ocultos, escondites, eventos diarios, atracos, misterios, tiendas, ropa, restaurantes, bares, bancos, hoteles, talleres, gasolineras, transporte, policía, ocio y lugares emblemáticos.
- **Filtros** por categoría (agrupadas como en el juego), por región y por confiabilidad del dato (✅ confirmado por 2+ fuentes, 📘 1 fuente, ❓ rumor, 👥 comunidad), además de un buscador.
- **Fichas con truco paso a paso**: hora, requisitos (misión, Snap Gun, Key Cloner…) y **video** de YouTube o TikTok que se reproduce ahí mismo. Los links de X, Instagram, Facebook, Twitch y Kick se muestran como botón.
- **Progreso personal**: marcar "encontrado" y guardar favoritos en el celular.
- **Aportes de usuarios**: se agregan tocando el mapa, ya sea un punto nuevo o una corrección o video para un punto existente.
  - Hay un filtro de groserías en español y en inglés que detecta leetspeak (`p3nd3j0`), letras separadas (`p.u.t.o`) y letras repetidas.
  - Marca teléfonos, correos, links en el texto, spam y textos todo en mayúsculas.
  - **Nada se publica en automático**: todo llega a `admin.html` como *pendiente*.
- **Panel de moderación** (`admin.html`): pendientes, publicados y rechazados. Resalta las groserías y permite editar antes de aprobar, rechazar con motivo, quitar del mapa y borrar.

## Probarlo en tu Mac

```bash
python3 -m http.server 8737
```

Abre http://localhost:8737 (mapa) y http://localhost:8737/admin.html (moderación).

**Estado actual:** conectado al proyecto de Supabase `leonida-atlas` (`tjbqwcrcybpznowmotfn`). Los aportes ya se comparten entre todos los usuarios y el panel pide el correo y la contraseña del moderador.
Para volver al modo demo (aportes guardados solo en el navegador), deja vacíos `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `js/config.js`.

Para volver a aplicar el esquema después de cambiarlo (el CLI debe tener sesión iniciada con la cuenta del proyecto):

```bash
supabase db query --remote=tjbqwcrcybpznowmotfn --yes -f supabase/schema.sql
```

## Montarlo en otro proyecto de Supabase

1. Crea un proyecto gratuito en https://supabase.com.
2. En **SQL Editor** pega y corre `supabase/schema.sql`. Crea las tablas, la seguridad (RLS) y el filtro en el servidor.
3. En **Authentication → Users → Add user** crea tu usuario moderador. Después corre:
   `insert into public.admins (user_id) select id from auth.users where email = 'tu@correo.com';`
4. En `js/config.js` llena `SUPABASE_URL` y `SUPABASE_ANON_KEY` (Project Settings → API).
5. Sube la carpeta completa a cualquier hosting estático (cPanel/public_html, Netlify, Vercel, GitHub Pages). **Necesita HTTPS** para instalarse como app.

Seguridad en producción: el público solo puede *insertar* aportes, que siempre quedan como `pendiente`, y solo puede *leer* los `aprobado`. Solo los usuarios de la tabla `admins` pueden moderar. La base de datos vuelve a revisar las groserías aunque alguien se salte el filtro del navegador.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html`, `js/app.js` | Mapa, filtros, fichas y formulario de aportes |
| `admin.html`, `js/admin.js`, `css/admin.css` | Panel de moderación |
| `js/data.js` | **Datos del mapa**: categorías, regiones y puntos. Aquí se agregan o corrigen los puntos oficiales |
| `js/moderation.js` | Filtro de groserías y spam |
| `js/store.js` | Guardado (modo demo o Supabase) |
| `assets/leonida.svg` | Mapa ilustrado (coordenadas 1000 × 1300) |
| `sw.js`, `manifest.webmanifest` | App instalable y uso sin conexión |
| `supabase/schema.sql` | Base de datos y reglas de seguridad |

## Sobre los datos

- Fuentes: GTA Xtreme, TheBestMods y Vice6Map (consultadas el 25-nov-2026, a una semana del lanzamiento). Cada ficha enlaza a su fuente.
- **Las posiciones en el mapa son aproximadas.** Las guías dan zona y calle, no coordenadas exactas. Los aportes de corrección sirven justo para afinarlas.
- Las guías a veces se contradicen. Por ejemplo, el Penumbra FF aparece en Vespucci Island según una guía y en Neptune Circle según otra. En esos casos la ficha lo indica.
- Sitio de fans **no oficial**, sin relación con Rockstar Games ni Take-Two. No usa logos ni arte del juego.

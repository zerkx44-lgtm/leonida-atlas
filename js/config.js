/* Configuración de Leonida Atlas.
 *
 * MODO DEMO (por defecto): los aportes se guardan en este navegador (localStorage).
 *   Sirve para probar el flujo completo: enviar → moderar en /admin.html → publicar.
 *   El PIN de administración de demo es solo para pruebas; no es seguro.
 *
 * MODO PRODUCCIÓN: crea un proyecto en Supabase, corre supabase/schema.sql
 *   y llena SUPABASE_URL y SUPABASE_ANON_KEY. El panel de admin pedirá
 *   correo y contraseña de un usuario registrado en la tabla `admins`.
 */
window.ATLAS_CONFIG = {
  SUPABASE_URL: 'https://tjbqwcrcybpznowmotfn.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_sy717hF_ewRFi2AX3Zk-bQ_6KglP3Qe', // clave pública (publishable), segura en el navegador
  // Captcha Cloudflare Turnstile (clave PÚBLICA "site key"). Vacío = sin captcha.
  // La clave SECRETA va solo en Supabase → Authentication → Attack Protection.
  TURNSTILE_SITE_KEY: '0x4AAAAAAGVACLP_7G2gNlDm',
  // Página de donaciones (Ko-fi)
  KOFI_URL: 'https://ko-fi.com/iframeees',
  DEMO_ADMIN_PIN: 'leonida2026',
  // Dominios aceptados para links de video en los aportes
  VIDEO_DOMINIOS: ['youtube.com', 'youtu.be', 'tiktok.com', 'x.com', 'twitter.com', 'instagram.com', 'facebook.com', 'fb.watch', 'twitch.tv', 'kick.com'],
  ESPERA_ENTRE_ENVIOS_SEG: 60,
  // Galería: en leonidaatlas.wiki las fotos se sirven desde nuestro servidor (/fotos/, con caché)
  // para no gastar la transferencia gratis de Supabase. Vacío = directo de Supabase.
  FOTOS_PROXY: '',
};

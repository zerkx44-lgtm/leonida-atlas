/* Capa de datos para aportes de la comunidad.
 * Modo demo  → localStorage (un solo navegador).
 * Modo Supabase → API REST de Supabase (PostgREST + Auth), sin librerías extra.
 */
const Store = (() => {
  const C = window.ATLAS_CONFIG;
  const MODO = C.SUPABASE_URL && C.SUPABASE_ANON_KEY ? 'supabase' : 'demo';
  const KEY = 'atlas_aportes_v1';
  const KEY_SESION = 'atlas_admin_sesion';

  /* ---------- DEMO ---------- */
  function leerDemo() {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
    const ahora = Date.now();
    const semilla = [
      { id: 'demo-1', created_at: new Date(ahora - 864e5).toISOString(), titulo: 'Mirador para fotos al atardecer', mensaje: 'Sube por la escalera de servicio del lado del mar; desde la azotea se ve toda la bahía. Ideal para el modo foto.',
        categoria: 'emblematico', video_url: '', apodo: 'Ejemplo', x: 700, y: 491, estado: 'aprobado', banderas: [], nota_admin: '' },
      { id: 'demo-2', created_at: new Date(ahora - 36e5).toISOString(), titulo: 'Lancha escondida en el manglar', mensaje: 'Detrás del muelle viejo hay una lancha con la llave puesta. Hay que entrar de noche porque hay guardias.',
        categoria: 'auto_raro', video_url: '', apodo: 'Ejemplo', x: 480, y: 560, estado: 'pendiente', banderas: [], nota_admin: '' },
    ];
    localStorage.setItem(KEY, JSON.stringify(semilla));
    return semilla;
  }
  const guardarDemo = arr => localStorage.setItem(KEY, JSON.stringify(arr));

  /* ---------- SUPABASE ---------- */
  function headers(token) {
    // La clave publishable va solo en `apikey`; Authorization solo lleva el JWT de un moderador con sesión.
    const h = { apikey: C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }
  async function sb(path, opts = {}, token) {
    const res = await fetch(`${C.SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: { ...headers(token), ...(opts.headers || {}) } });
    if (!res.ok) {
      let msg = res.statusText;
      try { const j = await res.json(); msg = j.message || j.msg || msg; } catch {}
      throw new Error(msg);
    }
    return res.status === 204 || res.headers.get('content-length') === '0' ? null : res.json().catch(() => null);
  }
  const sesion = () => JSON.parse(sessionStorage.getItem(KEY_SESION) || 'null');

  /* ---------- API PÚBLICA ---------- */
  async function listarAprobados() {
    if (MODO === 'demo') return leerDemo().filter(a => a.estado === 'aprobado');
    return sb('aportes?select=id,created_at,titulo,mensaje,categoria,video_url,apodo,x,y&estado=eq.aprobado&order=created_at.desc');
  }

  async function enviar(aporte) {
    const limpio = {
      titulo: aporte.titulo.trim(), mensaje: aporte.mensaje.trim(), categoria: aporte.categoria,
      video_url: (aporte.video_url || '').trim() || null, apodo: (aporte.apodo || '').trim() || null,
      x: Math.round(aporte.x * 10) / 10, y: Math.round(aporte.y * 10) / 10,
      banderas: aporte.banderas || [], tipo: aporte.tipo || 'nuevo', poi_ref: aporte.poi_ref || null,
    };
    if (MODO === 'demo') {
      const arr = leerDemo();
      arr.unshift({ ...limpio, id: 'u-' + Date.now().toString(36), created_at: new Date().toISOString(), estado: 'pendiente', nota_admin: '' });
      guardarDemo(arr);
      return;
    }
    await sb('aportes', { method: 'POST', body: JSON.stringify(limpio), headers: { Prefer: 'return=minimal' } });
  }

  /* ---------- ADMIN ---------- */
  async function login(usuario, clave, captchaToken) {
    if (MODO === 'demo') {
      if (clave !== C.DEMO_ADMIN_PIN) throw new Error('PIN incorrecto');
      sessionStorage.setItem(KEY_SESION, JSON.stringify({ demo: true, email: 'demo' }));
      return;
    }
    const res = await fetch(`${C.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: usuario, password: clave, ...(captchaToken ? { gotrue_meta_security: { captcha_token: captchaToken } } : {}) }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error_description || j.msg || 'No se pudo iniciar sesión');
    sessionStorage.setItem(KEY_SESION, JSON.stringify({ token: j.access_token, email: j.user?.email, expira: Date.now() + j.expires_in * 1000 }));
  }
  function logout() { sessionStorage.removeItem(KEY_SESION); }
  function haySesion() {
    const s = sesion();
    if (!s) return false;
    if (s.expira && Date.now() > s.expira) { logout(); return false; }
    return true;
  }

  async function listar(estado) {
    if (MODO === 'demo') return leerDemo().filter(a => !estado || a.estado === estado);
    const filtro = estado ? `&estado=eq.${estado}` : '';
    return sb(`aportes?select=*${filtro}&order=created_at.desc`, {}, sesion().token);
  }
  async function actualizar(id, cambios) {
    if (MODO === 'demo') {
      guardarDemo(leerDemo().map(a => (a.id === id ? { ...a, ...cambios, revisado_at: new Date().toISOString() } : a)));
      return;
    }
    // revisado_at / revisado_por los pone la base de datos (trigger).
    await sb(`aportes?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(cambios), headers: { Prefer: 'return=minimal' } }, sesion().token);
  }
  async function eliminar(id) {
    if (MODO === 'demo') { guardarDemo(leerDemo().filter(a => a.id !== id)); return; }
    await sb(`aportes?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }, sesion().token);
  }

  /* Llamada directa a la API con la sesión del moderador (chat). */
  const api = (path, opts = {}) => sb(path, opts, sesion()?.token);

  /* Borra archivos del almacenamiento de la galería (solo moderadores o el dueño). */
  async function borrarArchivos(rutas) {
    const r = await fetch(`${C.SUPABASE_URL}/storage/v1/object/galeria`, {
      method: 'DELETE', headers: { ...headers(sesion()?.token) }, body: JSON.stringify({ prefixes: rutas }) });
    if (!r.ok) { let m = 'No se pudo borrar la imagen'; try { const j = await r.json(); m = j.message || m; } catch {} throw new Error(m); }
  }

  return { borrarArchivos, MODO, listarAprobados, enviar, login, logout, haySesion, listar, actualizar, eliminar, sesion, api };
})();

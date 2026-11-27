/* Leonida Atlas — chat de la comunidad.
 * Cada visitante entra con una cuenta anónima de Supabase (sin correo ni contraseña).
 * La base de datos aplica las reglas (groserías, spam, límite de velocidad, bloqueos,
 * reportes); este archivo solo las explica y avisa antes de enviar.
 */
(() => {
  const C = window.ATLAS_CONFIG;
  const ACTIVO = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  const K_SES = 'atlas_chat_sesion', K_APODO = 'atlas_chat_apodo', K_REGLAS = 'atlas_chat_reglas_v1', K_VISTO = 'atlas_chat_visto';
  const REGLAS = [
    'Respeto ante todo: nada de groserías, insultos, odio, acoso ni amenazas.',
    'Habla del juego: rutas, trucos, ubicaciones, eventos y novedades.',
    'Nada de datos personales (teléfonos, correos, direcciones, redes privadas).',
    'Sin spam ni publicidad. Los links solo se permiten si son videos (YouTube, TikTok, X, Instagram, Twitch o Kick).',
    'Si vas a contar algo de la historia, avisa con "SPOILER:" al inicio.',
    'Los mensajes con 3 reportes se ocultan y un moderador los revisa. Quien rompa las reglas puede ser bloqueado.',
  ];

  /* ───── Interfaz ───── */
  const raiz = document.createElement('div');
  raiz.innerHTML = `
    <button id="chat-abrir" class="chat-fab" aria-label="Abrir chat de la comunidad">💬<span>Comunidad</span><em id="chat-nuevos" hidden></em></button>
    <aside id="chat" class="chat" aria-label="Chat de la comunidad" hidden>
      <header class="chat-cab">
        <div><b>💬 Comunidad</b><small id="chat-estado" class="tenue"></small></div>
        <div><button class="link" id="chat-ver-reglas">Reglas</button><button class="cerrar" id="chat-cerrar" aria-label="Cerrar chat">✕</button></div>
      </header>
      <div id="chat-fijado" class="chat-fijado" hidden></div>
      <ol id="chat-lista" class="chat-lista" aria-live="polite"></ol>
      <footer id="chat-pie" class="chat-pie"></footer>
    </aside>
    <dialog id="chat-dlg-reglas" class="dialogo">
      <header class="dlg-cab"><h2>Reglas del chat</h2><button type="button" class="cerrar" data-cerrar-dlg aria-label="Cerrar">✕</button></header>
      <ol class="ayuda">${REGLAS.map(r => `<li>${esc(r)}</li>`).join('')}</ol>
      <p class="tenue">Los mensajes con lenguaje no permitido no se publican. Moderamos a mano el resto. Más detalles en los <a href="terminos.html" target="_blank">términos de uso</a> y el <a href="privacidad.html" target="_blank">aviso de privacidad</a>.</p>
    </dialog>`;
  document.body.appendChild(raiz);
  const $ = s => document.querySelector(s);
  const panel = $('#chat'), lista = $('#chat-lista'), pie = $('#chat-pie');

  let mensajes = [], abierto = false, timer = null, enviando = false, widget = null;

  /* ───── Sesión anónima ───── */
  const sesion = () => JSON.parse(localStorage.getItem(K_SES) || 'null');
  async function auth(path, body) {
    const r = await fetch(`${C.SUPABASE_URL}/auth/v1/${path}`, { method: 'POST', headers: { apikey: C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.msg || j.error_description || 'No se pudo entrar al chat');
    const s = { token: j.access_token, refresh: j.refresh_token, expira: Date.now() + (j.expires_in - 60) * 1000, uid: j.user?.id };
    localStorage.setItem(K_SES, JSON.stringify(s));
    return s;
  }
  /* Crea la cuenta anónima; con captcha activo necesita el token del widget. */
  async function crearCuenta(captchaToken) {
    if (Captcha.activo() && !captchaToken) throw new Error('Completa la verificación anti-bots.');
    return auth('signup', captchaToken ? { gotrue_meta_security: { captcha_token: captchaToken } } : {});
  }
  async function token() {
    let s = sesion();
    if (s && Date.now() > s.expira) {
      try { s = await auth('token?grant_type=refresh_token', { refresh_token: s.refresh }); }
      catch { localStorage.removeItem(K_SES); s = null; }
    }
    if (!s) {
      if (Captcha.activo()) { localStorage.removeItem(K_REGLAS); pintarPie(); throw new Error('Tu sesión del chat venció: vuelve a entrar.'); }
      s = await crearCuenta(null);
    }
    return s.token;
  }
  async function api(path, opts = {}, conToken = false) {
    const h = { apikey: C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (conToken) h.Authorization = `Bearer ${await token()}`;
    const r = await fetch(`${C.SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: h });
    if (!r.ok) {
      let m = 'Error de conexión';
      try { const j = await r.json(); m = j.message || m; if (j.code === '23505') m = 'Ya reportaste este mensaje.'; } catch {}
      throw new Error(m);
    }
    return r.status === 204 || r.status === 201 ? null : r.json();
  }

  /* ───── Mensajes ───── */
  function linkify(t) {
    return esc(t).replace(/https:\/\/[^\s<]+/g, u => {
      const limpia = u.replace(/&amp;/g, '&');
      return Moderacion.videoPermitido(limpia) ? `<a href="${u}" target="_blank" rel="noopener noreferrer nofollow">▶ video</a>` : u;
    });
  }
  const hora = iso => new Date(iso).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

  function pintar(alFinal) {
    const mio = sesion()?.uid;
    const cerca = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 80;
    const orden = [...mensajes].sort((a, b) => a.id - b.id);
    lista.innerHTML = orden.map(m => `
      <li class="msj ${m.oficial ? 'oficial' : ''} ${m.user_id === mio ? 'mio' : ''}" data-id="${m.id}">
        <div class="msj-cab"><b>${m.oficial ? '📢 ' : ''}${esc(m.apodo)}</b>${m.oficial ? '<span class="ins oro">Oficial</span>' : ''}<time>${esc(hora(m.created_at))}</time>
          ${m.user_id !== mio && !m.oficial ? `<button class="msj-rep" data-reportar="${m.id}" title="Reportar mensaje" aria-label="Reportar mensaje">⚑</button>` : ''}</div>
        <p class="${/^\s*spoiler\s*:/i.test(m.texto) ? 'msj-spoiler' : ''}">${linkify(m.texto)}</p>
      </li>`).join('') || '<li class="vacio">Todavía no hay mensajes. ¡Sé el primero en saludar!</li>';
    const ultimoOficial = orden.filter(m => m.oficial).pop();
    const fij = $('#chat-fijado');
    fij.hidden = !ultimoOficial;
    if (ultimoOficial) fij.innerHTML = `<b>📢 Aviso:</b> ${linkify(ultimoOficial.texto)}`;
    if (alFinal || cerca) lista.scrollTop = lista.scrollHeight;
  }

  async function cargar(alFinal) {
    try {
      const nuevos = await api('chat_mensajes?select=id,created_at,apodo,texto,oficial,user_id&order=id.desc&limit=80');
      const cambio = nuevos.length !== mensajes.length || (nuevos[0] && mensajes[0]?.id !== nuevos[0].id) || nuevos.some((m, i) => mensajes[i]?.id !== m.id);
      mensajes = nuevos;
      $('#chat-estado').textContent = ' · en vivo';
      if (abierto) {
        if (cambio) pintar(alFinal);
        if (mensajes[0]) localStorage.setItem(K_VISTO, mensajes[0].id);
      }
      const visto = +localStorage.getItem(K_VISTO) || 0;
      const sinLeer = mensajes.filter(m => m.id > visto).length;
      const badge = $('#chat-nuevos');
      badge.hidden = abierto || !sinLeer || !visto;
      badge.textContent = sinLeer > 9 ? '9+' : sinLeer;
    } catch { $('#chat-estado').textContent = ' · sin conexión'; }
  }

  function programar() {
    clearTimeout(timer);
    if (!ACTIVO) return;
    timer = setTimeout(async () => { if (!document.hidden) await cargar(); programar(); }, abierto ? 4000 : 30000);
  }

  /* ───── Pie: entrada o caja de texto ───── */
  function pintarPie() {
    if (!ACTIVO) { pie.innerHTML = '<p class="tenue">El chat necesita la base de datos conectada.</p>'; return; }
    const apodo = localStorage.getItem(K_APODO);
    if (!apodo || !localStorage.getItem(K_REGLAS)) {
      pie.innerHTML = `
        <form id="chat-entrar" class="chat-entrar">
          <label class="campo">Tu apodo en el chat<input name="apodo" maxlength="24" minlength="2" required value="${esc(apodo || '')}" placeholder="Ej. ViceRider"></label>
          <label class="check"><input type="checkbox" name="reglas" required> <span>Acepto las <button type="button" class="link" data-ver-reglas>reglas del chat</button>.</span></label>
          <div id="chat-captcha" class="chat-captcha"></div>
          <p class="error" id="chat-error" hidden></p>
          <button class="btn primario">Entrar al chat</button>
        </form>`;
      widget = null;
      if (!sesion() && Captcha.activo()) Captcha.montar($('#chat-captcha')).then(w => { widget = w; }).catch(ex => error(ex.message));
      return;
    }
    pie.innerHTML = `
      <form id="chat-form" class="chat-form">
        <textarea name="texto" rows="2" maxlength="300" placeholder="Escribe un mensaje para la comunidad…" required></textarea>
        <div class="chat-form-pie"><small class="tenue">Como <b>${esc(apodo)}</b> · <button type="button" class="link" id="chat-cambiar">cambiar</button> · <span id="chat-cnt">0</span>/300</small>
          <button class="btn primario" id="chat-enviar">Enviar</button></div>
        <p class="error" id="chat-error" hidden></p>
      </form>`;
  }
  const error = m => { const e = $('#chat-error'); if (!e) return alert(m); e.textContent = m; e.hidden = !m; };

  pie.addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    if (f.id === 'chat-entrar') {
      const apodo = f.apodo.value.trim();
      if (apodo.length < 2) return error('El apodo necesita al menos 2 letras.');
      if (Moderacion.revisar({ apodo }).bloqueado) return error('Ese apodo no está permitido. Elige otro.');
      if (!f.reglas.checked) return error('Acepta las reglas para entrar.');
      try {
        if (!sesion()) await crearCuenta(widget?.token());
        else await token();
      } catch (ex) { widget?.reset(); return error(/captcha/i.test(ex.message) ? 'La verificación anti-bots falló; inténtalo de nuevo.' : ex.message); }
      localStorage.setItem(K_APODO, apodo); localStorage.setItem(K_REGLAS, '1');
      pintarPie(); $('#chat-form textarea')?.focus();
      return;
    }
    if (f.id === 'chat-form' && !enviando) {
      const texto = f.texto.value.trim();
      if (!texto) return;
      const r = Moderacion.revisar({ mensaje: texto, apodo: localStorage.getItem(K_APODO) });
      if (r.bloqueado) return error('Tu mensaje tiene lenguaje no permitido. Corrígelo para enviarlo.');
      enviando = true; $('#chat-enviar').disabled = true; error('');
      try {
        await api('chat_mensajes', { method: 'POST', body: JSON.stringify({ apodo: localStorage.getItem(K_APODO), texto }), headers: { Prefer: 'return=minimal' } }, true);
        f.texto.value = ''; $('#chat-cnt').textContent = '0';
        await cargar(true);
      } catch (ex) { error(ex.message); }
      finally { enviando = false; const b = $('#chat-enviar'); if (b) b.disabled = false; }
    }
  });
  pie.addEventListener('input', e => { if (e.target.name === 'texto') $('#chat-cnt').textContent = e.target.value.length; });
  pie.addEventListener('keydown', e => { if (e.target.name === 'texto' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.form.requestSubmit(); } });
  pie.addEventListener('click', e => {
    if (e.target.id === 'chat-cambiar') { localStorage.removeItem(K_REGLAS); pintarPie(); }
    if (e.target.closest('[data-ver-reglas]')) $('#chat-dlg-reglas').showModal();
  });

  lista.addEventListener('click', async e => {
    const b = e.target.closest('[data-reportar]');
    if (!b) return;
    if (!localStorage.getItem(K_REGLAS)) return alert('Entra al chat (abajo) para poder reportar mensajes.');
    if (!confirm('¿Reportar este mensaje por romper las reglas? Con 3 reportes se oculta hasta que un moderador lo revise.')) return;
    try { await api('chat_reportes', { method: 'POST', body: JSON.stringify({ mensaje_id: +b.dataset.reportar }), headers: { Prefer: 'return=minimal' } }, true); b.textContent = '✓'; b.disabled = true; }
    catch (ex) { alert(ex.message); }
  });

  /* ───── Abrir / cerrar ───── */
  function abrir() {
    abierto = true; panel.hidden = false; document.body.classList.add('chat-abierto');
    pintarPie(); pintar(true); cargar(true); programar();
    if (mensajes[0]) localStorage.setItem(K_VISTO, mensajes[0].id);
    $('#chat-nuevos').hidden = true;
  }
  function cerrar() { abierto = false; panel.hidden = true; document.body.classList.remove('chat-abierto'); programar(); }
  $('#chat-abrir').addEventListener('click', () => (abierto ? cerrar() : abrir()));
  $('#chat-cerrar').addEventListener('click', cerrar);
  $('#chat-ver-reglas').addEventListener('click', () => $('#chat-dlg-reglas').showModal());
  $('#chat-dlg-reglas').addEventListener('click', e => { if (e.target.closest('[data-cerrar-dlg]') || e.target === e.currentTarget) e.currentTarget.close(); });
  if (location.hash === '#chat') abrir();

  if (ACTIVO) { cargar(); programar(); }
})();

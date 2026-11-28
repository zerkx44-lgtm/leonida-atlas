/* Leonida Atlas — galería de capturas de la comunidad.
 * - Las fotos se optimizan en el navegador (máx. 1920 px, WEBP) y se les quitan los metadatos.
 * - Se suben a Supabase Storage dentro de la carpeta de la cuenta anónima de la comunidad.
 * - Entran "en revisión": solo aparecen en la galería cuando un moderador las aprueba.
 * - Los "fuegos" ❤️‍🔥 son los likes: uno por persona y foto.
 * La base de datos aplica todas las reglas; este archivo solo las explica.
 */
(() => {
  const C = window.ATLAS_CONFIG;
  const $ = s => document.querySelector(s);
  const POR_PAGINA = 24;
  const CAMPOS = 'id,created_at,user_id,apodo,titulo,zona,ruta,ruta_mini,ancho,alto,estado,fuegos';
  const ZONAS = ['Vice City', 'Vice Beach', 'Leonida Keys', 'Grassrivers', 'Port Gellhorn', 'Ambrosia', 'Mount Kalaga', 'Kelly County', 'Crude Islands', 'Downtown Vice City', 'Little Cuba', 'VCIA (aeropuerto)'];
  const BASE_FOTOS = C.FOTOS_PROXY && location.hostname === 'leonidaatlas.wiki'
    ? C.FOTOS_PROXY : `${C.SUPABASE_URL}/storage/v1/object/public/galeria/`;
  const url = ruta => BASE_FOTOS + ruta.split('/').map(encodeURIComponent).join('/');

  let orden = 'fuego', fotos = [], pagina = 0, hayMas = false, misFuegos = new Set(), pendiente = null, consulta = 0;
  const grid = $('#grid');

  $('#zonas').innerHTML = ZONAS.map(z => `<option value="${esc(z)}">`).join('');

  /* ───── API ───── */
  async function api(path, opts = {}, conToken = false) {
    const h = { apikey: C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (conToken) h.Authorization = `Bearer ${await Comunidad.token()}`;
    const r = await fetch(`${C.SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: h });
    if (!r.ok) {
      let m = 'Error de conexión';
      try { const j = await r.json(); m = j.message || m; if (j.code === '23505') m = 'Ya lo habías hecho.'; } catch {}
      throw new Error(m);
    }
    return r.status === 204 || r.status === 201 ? null : r.json();
  }
  async function storage(metodo, ruta, body, tipo) {
    const h = { apikey: C.SUPABASE_ANON_KEY, Authorization: `Bearer ${await Comunidad.token()}` };
    if (tipo) Object.assign(h, { 'Content-Type': tipo, 'cache-control': 'max-age=604800', 'x-upsert': 'false' });
    else h['Content-Type'] = 'application/json';
    const r = await fetch(`${C.SUPABASE_URL}/storage/v1/object/galeria${ruta ? '/' + ruta : ''}`, { method: metodo, headers: h, body });
    if (!r.ok) {
      let m = 'No se pudo subir la imagen';
      try { const j = await r.json(); m = j.message || j.error || m; } catch {}
      if (/size|large|maximum/i.test(m)) m = 'La imagen pesa demasiado aun optimizada; prueba con otra.';
      if (/security|policy|unauthorized/i.test(m)) m = 'No tienes permiso para subir fotos (¿tu cuenta está bloqueada?).';
      throw new Error(m);
    }
  }
  const borrarArchivos = rutas => storage('DELETE', '', JSON.stringify({ prefixes: rutas })).catch(() => {});

  /* ───── Cargar y pintar ───── */
  async function cargar(reiniciar = true) {
    if (!Comunidad.activo) { grid.innerHTML = '<p class="vacio">La galería necesita la base de datos conectada.</p>'; return; }
    const mia = ++consulta;  // si cambian de pestaña a media carga, se ignora la respuesta vieja
    $('#btn-mas').disabled = true;
    if (reiniciar) { pagina = 0; fotos = []; grid.innerHTML = '<p class="vacio">Cargando fotos…</p>'; }
    try {
      let q;
      if (orden === 'mias') q = api(`galeria_fotos?select=${CAMPOS}&user_id=eq.${Comunidad.sesion().uid}&order=created_at.desc`, {}, true);
      else {
        const ord = orden === 'fuego' ? 'fuegos.desc,created_at.desc' : 'created_at.desc';
        q = api(`galeria_fotos?select=${CAMPOS}&estado=eq.aprobado&order=${ord}&limit=${POR_PAGINA + 1}&offset=${pagina * POR_PAGINA}`);
      }
      const nuevas = await q;
      if (mia !== consulta) return;
      hayMas = orden !== 'mias' && nuevas.length > POR_PAGINA;
      fotos = fotos.concat(nuevas.slice(0, POR_PAGINA));
      pintar();
    } catch (ex) { if (mia === consulta) grid.innerHTML = `<p class="vacio">No se pudieron cargar las fotos: ${esc(ex.message)}</p>`; }
    finally { $('#btn-mas').disabled = false; }
  }

  async function cargarMisFuegos() {
    if (!Comunidad.sesion()) return;
    try { misFuegos = new Set((await api(`galeria_fuegos?select=foto_id&user_id=eq.${Comunidad.sesion().uid}`, {}, true)).map(f => f.foto_id)); pintar(); }
    catch {}
  }

  const btnFuego = f => {
    const mia = f.user_id === Comunidad.sesion()?.uid;
    return `<button class="fuego ${misFuegos.has(f.id) ? 'on' : ''}" data-fuego="${esc(f.id)}" ${mia || f.estado !== 'aprobado' ? 'disabled' : ''}
      title="${mia ? 'Tu foto' : misFuegos.has(f.id) ? 'Quitar fuego' : 'Dar fuego'}" aria-pressed="${misFuegos.has(f.id)}"
      aria-label="${f.fuegos} fuegos. ${misFuegos.has(f.id) ? 'Quitar fuego' : 'Dar fuego'}"><span class="llama">❤️‍🔥</span> <b>${f.fuegos}</b></button>`;
  };

  function pintar() {
    $('#tab-mias').hidden = !Comunidad.sesion();
    $('#btn-mas').hidden = !hayMas;
    if (!fotos.length) {
      grid.innerHTML = orden === 'mias'
        ? '<p class="vacio">Todavía no has subido fotos. <button class="link" data-subir>Sube tu primera captura</button>.</p>'
        : '<p class="vacio">📸 Todavía no hay fotos publicadas.<br><button class="btn primario" data-subir>Sé el primero en subir una captura</button></p>';
      return;
    }
    grid.innerHTML = fotos.map((f, i) => `
      <figure class="foto ${orden === 'fuego' && i === 0 && f.fuegos > 0 ? 'top' : ''}" data-id="${esc(f.id)}">
        <button class="foto-abrir" data-abrir="${esc(f.id)}" aria-label="Ver foto: ${esc(f.titulo)}">
          <img src="${esc(url(f.ruta_mini))}" alt="${esc(f.titulo)}" loading="lazy" decoding="async" ${f.ancho ? `width="${f.ancho}" height="${f.alto}"` : ''}>
        </button>
        ${orden === 'fuego' && i === 0 && f.fuegos > 0 ? '<span class="corona">👑 La más prendida</span>' : ''}
        ${f.estado !== 'aprobado' ? '<span class="revision">⏳ En revisión</span>' : ''}
        <figcaption>
          <div><b>${esc(f.titulo)}</b><small>${f.zona ? '📍 ' + esc(f.zona) + ' · ' : ''}por ${esc(f.apodo)}</small></div>
          ${btnFuego(f)}
        </figcaption>
      </figure>`).join('');
  }

  /* ───── Ver una foto ───── */
  async function abrirFoto(id) {
    let f = fotos.find(x => x.id === id);
    if (!f) {
      try { f = (await api(`galeria_fotos?select=${CAMPOS}&id=eq.${encodeURIComponent(id)}`, {}, !!Comunidad.sesion()))[0]; } catch {}
      if (!f) return toast('Esa foto ya no está disponible.');
      fotos.unshift(f);
    }
    const mia = f.user_id === Comunidad.sesion()?.uid;
    $('#foto-contenido').innerHTML = `
      <button type="button" class="cerrar f-cerrar" data-cerrar-dlg aria-label="Cerrar">✕</button>
      <a href="${esc(url(f.ruta))}" target="_blank" rel="noopener" class="foto-grande"><img src="${esc(url(f.ruta))}" alt="${esc(f.titulo)}" ${f.ancho ? `width="${f.ancho}" height="${f.alto}"` : ''}></a>
      <div class="foto-info" data-id="${esc(f.id)}">
        <div><h2>${esc(f.titulo)}</h2>
          <p class="tenue">${f.zona ? '📍 ' + esc(f.zona) + ' · ' : ''}por <b>${esc(f.apodo)}</b> · ${esc(fechaCorta(f.created_at))}${f.estado !== 'aprobado' ? ' · ⏳ en revisión' : ''}</p></div>
        ${btnFuego(f)}
      </div>
      <div class="f-acciones">
        ${f.estado === 'aprobado' ? '<button class="btn ghost" data-compartir>🔗 Compartir</button>' : ''}
        ${mia ? '<button class="btn ghost" data-borrar-mia>🗑 Borrar mi foto</button>' : f.estado === 'aprobado' ? '<button class="btn ghost" data-reportar>⚑ Reportar</button>' : ''}
      </div>`;
    $('#dlg-foto').dataset.id = f.id;
    if (!$('#dlg-foto').open) $('#dlg-foto').showModal();
    history.replaceState(null, '', '#foto=' + f.id);
  }
  $('#dlg-foto').addEventListener('close', () => history.replaceState(null, '', location.pathname));

  $('#dlg-foto').addEventListener('click', async e => {
    const dlg = e.currentTarget, id = dlg.dataset.id, f = fotos.find(x => x.id === id);
    if (e.target === dlg) return dlg.close();
    if (e.target.closest('[data-compartir]')) {
      const link = `${location.origin}${location.pathname}#foto=${id}`;
      const datos = { title: `${f.titulo} — Galería Leonida Atlas`, text: `Mira esta captura de GTA VI: "${f.titulo}" ❤️‍🔥`, url: link };
      try {
        if (navigator.share) await navigator.share(datos);
        else { await navigator.clipboard.writeText(link); toast('Link copiado ✓'); }
      } catch {}
    }
    if (e.target.closest('[data-reportar]')) {
      if (!Comunidad.dentro()) return pedirEntrada('Para reportar una foto entra a la comunidad.', () => abrirFoto(id));
      if (!confirm('¿Reportar esta foto por romper las reglas? Con 3 reportes regresa a revisión.')) return;
      try { await api('galeria_reportes', { method: 'POST', body: JSON.stringify({ foto_id: id }), headers: { Prefer: 'return=minimal' } }, true); toast('Gracias, lo revisaremos.'); }
      catch (ex) { toast(ex.message); }
    }
    if (e.target.closest('[data-borrar-mia]')) {
      if (!confirm('¿Borrar tu foto de la galería? No se puede deshacer.')) return;
      try {
        await api(`galeria_fotos?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }, true);
        await borrarArchivos([f.ruta, f.ruta_mini]);
        fotos = fotos.filter(x => x.id !== id); dlg.close(); pintar(); toast('Foto borrada');
      } catch (ex) { toast(ex.message); }
    }
  });

  /* ───── Fuegos ❤️‍🔥 ───── */
  async function fuego(id, boton) {
    if (!Comunidad.dentro()) return pedirEntrada('Para darle fuego a una foto entra a la comunidad (es gratis y sin correo).', () => fuego(id));
    const f = fotos.find(x => x.id === id);
    if (!f || f.user_id === Comunidad.sesion().uid) return;
    const dar = !misFuegos.has(id);
    // Cambio inmediato en pantalla; se revierte si la base de datos lo rechaza.
    dar ? misFuegos.add(id) : misFuegos.delete(id);
    f.fuegos += dar ? 1 : -1;
    refrescarBotones(id);
    if (dar && boton) chispas(boton);
    try {
      if (dar) await api('galeria_fuegos', { method: 'POST', body: JSON.stringify({ foto_id: id }), headers: { Prefer: 'return=minimal' } }, true);
      else await api(`galeria_fuegos?foto_id=eq.${encodeURIComponent(id)}&user_id=eq.${Comunidad.sesion().uid}`, { method: 'DELETE' }, true);
    } catch (ex) {
      if (!/Ya lo habías/.test(ex.message)) { dar ? misFuegos.delete(id) : misFuegos.add(id); f.fuegos += dar ? -1 : 1; toast(ex.message); }
      refrescarBotones(id);
    }
  }
  function refrescarBotones(id) {
    const f = fotos.find(x => x.id === id);
    document.querySelectorAll(`[data-fuego="${CSS.escape(id)}"]`).forEach(b => { b.outerHTML = btnFuego(f); });
  }
  function chispas(boton) {
    const r = boton.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('span');
      s.className = 'chispa'; s.textContent = i % 3 ? '🔥' : '❤️';
      s.style.left = `${r.left + r.width / 2}px`; s.style.top = `${r.top + r.height / 2}px`;
      s.style.setProperty('--dx', `${(Math.random() - .5) * 120}px`); s.style.setProperty('--dy', `${-40 - Math.random() * 80}px`);
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  }

  /* ───── Entrar a la comunidad ───── */
  let widget = null;
  function pedirEntrada(motivo, despues) {
    pendiente = despues;
    const f = $('#form-entrar');
    $('#entrar-motivo').textContent = motivo;
    f.apodo.value = Comunidad.apodo() || '';
    $('#entrar-error').hidden = true;
    $('#entrar-captcha').innerHTML = ''; widget = null;
    if (!Comunidad.sesion() && Captcha.activo()) Captcha.montar($('#entrar-captcha')).then(w => { widget = w; }).catch(ex => errorEn('#entrar-error', ex.message));
    $('#dlg-entrar').showModal();
  }
  const errorEn = (sel, m) => { const e = $(sel); e.textContent = m; e.hidden = !m; };

  $('#form-entrar').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, apodo = f.apodo.value.trim();
    if (apodo.length < 2) return errorEn('#entrar-error', 'El apodo necesita al menos 2 letras.');
    if (Moderacion.revisar({ apodo }).bloqueado) return errorEn('#entrar-error', 'Ese apodo no está permitido. Elige otro.');
    try {
      if (!Comunidad.sesion()) await Comunidad.crearCuenta(widget?.token());
      else await Comunidad.token();
    } catch (ex) {
      widget?.reset();
      if (!Comunidad.sesion() && !widget && Captcha.activo()) { pedirEntrada($('#entrar-motivo').textContent, pendiente); }
      return errorEn('#entrar-error', /captcha/i.test(ex.message) ? 'La verificación anti-bots falló; inténtalo de nuevo.' : ex.message);
    }
    Comunidad.entrar(apodo);
    $('#dlg-entrar').close();
    toast(`¡Bienvenido, ${apodo}!`);
    await cargarMisFuegos();
    pintar();
    const sig = pendiente; pendiente = null;
    if (sig) sig();
  });

  /* ───── Subir una foto ───── */
  let preparada = null;
  function abrirSubir() {
    if (!Comunidad.dentro()) return pedirEntrada('Para subir fotos entra a la comunidad (es gratis y sin correo).', abrirSubir);
    $('#form-subir').reset(); preparada = null;
    $('#vista').hidden = true; $('#soltar-txt').hidden = false; errorEn('#subir-error', '');
    $('#dlg-subir').showModal();
  }

  const soportaWebp = (() => { try { const c = document.createElement('canvas'); c.width = c.height = 1; return c.toDataURL('image/webp').startsWith('data:image/webp'); } catch { return false; } })();

  async function leerImagen(archivo) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(archivo, { imageOrientation: 'from-image' }); } catch {}
    }
    return new Promise((ok, mal) => {
      const img = new Image(), u = URL.createObjectURL(archivo);
      img.onload = () => { URL.revokeObjectURL(u); ok(img); };
      img.onerror = () => { URL.revokeObjectURL(u); mal(new Error('No pudimos leer esa imagen. Prueba con una captura JPG o PNG.')); };
      img.src = u;
    });
  }
  async function aBlob(img, maximo, calidades, limite) {
    const w0 = img.width, h0 = img.height, s = Math.min(1, maximo / Math.max(w0, h0));
    const c = document.createElement('canvas');
    c.width = Math.round(w0 * s); c.height = Math.round(h0 * s);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const tipo = soportaWebp ? 'image/webp' : 'image/jpeg';
    let blob = null;
    for (const q of calidades) {
      blob = await new Promise(r => c.toBlob(r, tipo, q));
      if (blob && blob.size <= limite) break;
    }
    if (!blob || blob.size > limite) throw new Error('La imagen pesa demasiado aun optimizada; prueba con otra.');
    return { blob, ancho: c.width, alto: c.height };
  }
  async function preparar(archivo) {
    if (!archivo) return null;
    if (archivo.size > 30e6) throw new Error('El archivo es demasiado grande (máx. 30 MB).');
    const img = await leerImagen(archivo);
    if (Math.max(img.width, img.height) < 600) throw new Error('La imagen es muy pequeña (mínimo 600 px de ancho).');
    const grande = await aBlob(img, 1920, [0.86, 0.78, 0.7, 0.6, 0.5], 1_000_000);
    const mini = await aBlob(img, 720, [0.72, 0.6, 0.5], 250_000);
    img.close?.();
    return { grande, mini, ext: soportaWebp ? 'webp' : 'jpg' };
  }

  $('#form-subir').archivo.addEventListener('change', async e => {
    const archivo = e.target.files[0];
    errorEn('#subir-error', ''); preparada = null;
    if (!archivo) return;
    $('#soltar-txt').innerHTML = '⏳ Optimizando la imagen…'; $('#soltar-txt').hidden = false; $('#vista').hidden = true;
    try {
      preparada = await preparar(archivo);
      const v = $('#vista');
      if (v.src) URL.revokeObjectURL(v.src);
      v.src = URL.createObjectURL(preparada.mini.blob); v.hidden = false; $('#soltar-txt').hidden = true;
      const f = $('#form-subir');
      if (!f.titulo.value) f.titulo.focus();
    } catch (ex) {
      e.target.value = '';
      $('#soltar-txt').innerHTML = '📷 Toca para elegir una captura<br><small class="tenue">JPG, PNG o WEBP · la optimizamos antes de subirla</small>';
      errorEn('#subir-error', ex.message);
    }
  });

  $('#form-subir').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, btn = $('#btn-enviar-foto');
    const titulo = f.titulo.value.trim(), zona = f.zona.value.trim();
    if (!preparada) return errorEn('#subir-error', 'Elige una captura primero.');
    if (titulo.length < 3) return errorEn('#subir-error', 'Ponle un título de al menos 3 letras.');
    if (Moderacion.revisar({ titulo, mensaje: zona, apodo: Comunidad.apodo() }).bloqueado) return errorEn('#subir-error', 'El título tiene lenguaje no permitido.');
    if (!f.mia.checked) return errorEn('#subir-error', 'Confirma que la captura es tuya.');
    btn.disabled = true; errorEn('#subir-error', '');
    const uid = Comunidad.sesion().uid, id = crypto.randomUUID();
    const ruta = `${uid}/${id}.${preparada.ext}`, rutaMini = `${uid}/${id}_m.${preparada.ext}`;
    let subidas = [];
    try {
      btn.textContent = 'Subiendo… 1/2';
      await storage('POST', ruta, preparada.grande.blob, preparada.grande.blob.type); subidas.push(ruta);
      btn.textContent = 'Subiendo… 2/2';
      await storage('POST', rutaMini, preparada.mini.blob, preparada.mini.blob.type); subidas.push(rutaMini);
      await api('galeria_fotos', { method: 'POST', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ apodo: Comunidad.apodo(), titulo, zona: zona || null, ruta, ancho: preparada.grande.ancho, alto: preparada.grande.alto }) }, true);
      $('#dlg-subir').close();
      toast('¡Listo! Tu foto está en revisión. Te aparecerá en "Mis fotos" mientras la aprueban.', 5000);
      elegirOrden('mias');
    } catch (ex) {
      if (subidas.length) await borrarArchivos(subidas);
      errorEn('#subir-error', ex.message);
    } finally { btn.disabled = false; btn.textContent = 'Enviar a revisión'; }
  });

  /* ───── Eventos ───── */
  function elegirOrden(o) {
    orden = o;
    document.querySelectorAll('[data-orden]').forEach(b => b.classList.toggle('on', b.dataset.orden === o));
    cargar();
  }
  document.querySelectorAll('[data-orden]').forEach(b => b.addEventListener('click', () => elegirOrden(b.dataset.orden)));
  $('#btn-subir').addEventListener('click', abrirSubir);
  $('#btn-mas').addEventListener('click', () => { pagina++; cargar(false); });
  grid.addEventListener('click', e => {
    const fb = e.target.closest('[data-fuego]');
    if (fb) return fuego(fb.dataset.fuego, fb);
    const ab = e.target.closest('[data-abrir]');
    if (ab) return abrirFoto(ab.dataset.abrir);
    if (e.target.closest('[data-subir]')) abrirSubir();
  });
  $('#dlg-foto').addEventListener('click', e => { const fb = e.target.closest('[data-fuego]'); if (fb) fuego(fb.dataset.fuego, fb); });
  document.addEventListener('click', e => { const d = e.target.closest('[data-cerrar-dlg]'); if (d) d.closest('dialog').close(); });
  document.querySelectorAll('#dlg-subir, #dlg-entrar').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  (async () => {
    await cargar();
    cargarMisFuegos();
    const m = location.hash.match(/^#foto=([0-9a-f-]{36})$/);
    if (m) abrirFoto(m[1]);
  })();
})();

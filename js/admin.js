/* Panel de moderación: nada se publica sin que un moderador lo apruebe aquí. */
(() => {
  const $ = s => document.querySelector(s);
  let tab = 'pendiente';
  let aportes = [];

  const demo = Store.MODO === 'demo';
  $('#modo').textContent = demo ? 'Modo demo (este navegador)' : 'Conectado a Supabase';
  $('#login-ayuda').textContent = demo
    ? 'Modo demo: escribe el PIN de config.js. Para producción conecta Supabase (ver README).'
    : 'Usa el correo y contraseña de un usuario dado de alta en la tabla admins.';
  if (demo) { $('#campo-email').hidden = true; $('#lbl-clave').textContent = 'PIN de demo'; }

  function mostrar() {
    const dentro = Store.haySesion();
    $('#login').hidden = dentro;
    $('#panel-admin').hidden = !dentro;
    $('#btn-salir').hidden = !dentro;
    if (dentro) cargar();
  }

  let widgetLogin = null;
  if (!demo && Captcha.activo()) Captcha.montar($('#login-captcha')).then(w => { widgetLogin = w; }).catch(ex => { $('#login-error').textContent = ex.message; $('#login-error').hidden = false; });
  $('#form-login').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, err = $('#login-error');
    err.hidden = true;
    if (!demo && Captcha.activo() && !widgetLogin?.token()) { err.textContent = 'Completa la verificación anti-bots.'; err.hidden = false; return; }
    try { await Store.login(f.email.value.trim(), f.clave.value, widgetLogin?.token()); f.reset(); mostrar(); }
    catch (ex) { widgetLogin?.reset(); err.textContent = ex.message; err.hidden = false; }
  });
  $('#btn-salir').addEventListener('click', () => { Store.logout(); mostrar(); });

  async function cargar() {
    try { aportes = await Store.listar(); }
    catch (ex) { toast('Error al cargar: ' + ex.message); if (/jwt|token|auth/i.test(ex.message)) { Store.logout(); mostrar(); } return; }
    for (const e of ['pendiente', 'aprobado', 'rechazado']) $('#n-' + e).textContent = aportes.filter(a => a.estado === e).length;
    pintar();
  }

  /* Revisa el texto otra vez y resalta las palabras problemáticas. */
  function analizar(a) {
    const r = Moderacion.revisar(a);
    const banderas = [...new Set([...(a.banderas || []), ...r.banderas])];
    if (a.video_url && !Moderacion.videoPermitido(a.video_url)) banderas.push('video de dominio no permitido');
    return { groserias: r.groserias, banderas };
  }
  function resaltar(texto, raices) {
    if (!raices.length) return esc(texto);
    return texto.split(/(\s+)/).map(tok => {
      const n = Moderacion.normalizar(tok).replace(/[^a-zñ]/g, '');
      return raices.some(g => n.startsWith(g) || n.replace(/(.)\1+/g, '$1').includes(g)) ? `<mark>${esc(tok)}</mark>` : esc(tok);
    }).join('');
  }

  function miniMapa(x, y) {
    const s = 0.6, w = 180;
    return `<div class="mini-mapa" role="img" aria-label="Ubicación en el mapa"
      style="background-size:${MAPA_W * s}px ${MAPA_H * s}px;background-position:${w / 2 - x * s}px ${w / 2 - y * s}px"></div>`;
  }

  /* ───── Chat ───── */
  let chatMsgs = [], bloqueados = [];
  async function cargarChat() {
    if (demo) { $('#cola').innerHTML = '<div class="vacio-cola">El chat solo funciona con Supabase conectado.</div>'; return; }
    try {
      [chatMsgs, bloqueados] = await Promise.all([
        Store.api('chat_mensajes?select=id,created_at,apodo,texto,oficial,oculto,reportes,user_id&order=id.desc&limit=200'),
        Store.api('chat_bloqueados?select=user_id,motivo,hasta,creado&order=creado.desc'),
      ]);
    } catch (ex) { toast('Error al cargar el chat: ' + ex.message); return; }
    $('#n-chat').textContent = chatMsgs.filter(m => m.oculto).length || '·';
    pintarChat();
  }
  function pintarChat() {
    const bloq = new Set(bloqueados.filter(b => !b.hasta || new Date(b.hasta) > new Date()).map(b => b.user_id));
    const orden = [...chatMsgs].sort((a, b) => (b.oculto - a.oculto) || (b.reportes - a.reportes) || (b.id - a.id));
    $('#cola').innerHTML = `
      <form id="form-aviso" class="aporte aviso-form">
        <div><h3>📢 Publicar aviso oficial</h3><p class="tenue">Aparece destacado y fijado arriba del chat para todos.</p></div>
        <div><textarea name="texto" rows="2" maxlength="300" required placeholder="Ej. ¡Agregamos 30 coleccionables nuevos al mapa!"></textarea>
          <label class="campo">Firma<input name="apodo" maxlength="24" value="Equipo Leonida Atlas"></label>
          <button class="btn primario">Publicar aviso</button></div>
      </form>
      ${bloqueados.length ? `<div class="aporte"><div><h3>⛔ Bloqueados</h3></div><div>${bloqueados.map(b => `
        <p class="meta"><span>${esc(b.user_id.slice(0, 8))}…</span><span>${esc(b.motivo || '')}</span><span>${b.hasta ? 'hasta ' + esc(fechaCorta(b.hasta)) : 'permanente'}</span>
        <button class="btn ghost" data-c="desbloquear" data-u="${esc(b.user_id)}">Desbloquear</button></p>`).join('')}</div></div>` : ''}
      ${orden.map(m => `
        <article class="aporte chat-adm ${m.oculto ? 'alerta' : ''}" data-mid="${m.id}" data-u="${esc(m.user_id)}">
          <div class="meta-chat">${m.oficial ? '📢 Oficial' : m.oculto ? '🙈 Oculto' : '💬 Visible'}<br><small>${esc(fechaCorta(m.created_at))}</small>
            ${m.reportes ? `<br><span class="bandera roja">⚑ ${m.reportes} reporte(s)</span>` : ''}${bloq.has(m.user_id) ? '<br><span class="bandera">⛔ bloqueado</span>' : ''}</div>
          <div><h3>${esc(m.apodo)} <small class="tenue">${esc(m.user_id.slice(0, 8))}…</small></h3>
            <p class="mensaje">${esc(m.texto)}</p>
            <div class="botones">
              ${m.oculto ? '<button class="btn aprobar" data-c="mostrar">👁 Volver a mostrar</button>' : '<button class="btn ghost" data-c="ocultar">🙈 Ocultar</button>'}
              <button class="btn rechazar" data-c="borrar">🗑 Borrar</button>
              ${!m.oficial && !bloq.has(m.user_id) ? '<button class="btn ghost" data-c="bloq24">⛔ Bloquear 24 h</button><button class="btn ghost" data-c="bloqperm">⛔ Bloquear siempre</button>' : ''}
            </div></div>
        </article>`).join('') || '<div class="vacio-cola">No hay mensajes en el chat.</div>'}`;
  }
  $('#cola').addEventListener('submit', async e => {
    if (e.target.id !== 'form-aviso') return;
    e.preventDefault();
    const f = e.target;
    try {
      await Store.api('chat_mensajes', { method: 'POST', body: JSON.stringify({ texto: f.texto.value.trim(), apodo: f.apodo.value.trim() || 'Equipo Leonida Atlas', oficial: true }), headers: { Prefer: 'return=minimal' } });
      toast('Aviso publicado'); await cargarChat();
    } catch (ex) { toast('Error: ' + ex.message); }
  });
  $('#cola').addEventListener('click', async e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    const art = b.closest('[data-mid]'), id = art?.dataset.mid, uid = b.dataset.u || art?.dataset.u;
    try {
      const c = b.dataset.c;
      if (c === 'ocultar' || c === 'mostrar') await Store.api(`chat_mensajes?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ oculto: c === 'ocultar' }), headers: { Prefer: 'return=minimal' } });
      if (c === 'borrar') { if (!confirm('¿Borrar este mensaje para siempre?')) return; await Store.api(`chat_mensajes?id=eq.${id}`, { method: 'DELETE' }); }
      if (c === 'bloq24' || c === 'bloqperm') {
        const motivo = prompt('Motivo del bloqueo (solo lo ven los moderadores):', 'Romper las reglas del chat'); if (motivo === null) return;
        const hasta = c === 'bloq24' ? new Date(Date.now() + 864e5).toISOString() : null;
        await Store.api('chat_bloqueados', { method: 'POST', body: JSON.stringify({ user_id: uid, motivo, hasta }), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
      }
      if (c === 'desbloquear') await Store.api(`chat_bloqueados?user_id=eq.${encodeURIComponent(uid)}`, { method: 'DELETE' });
      toast('Listo'); await cargarChat();
    } catch (ex) { toast('Error: ' + ex.message); }
  });

  function pintar() {
    if (tab === 'chat') return cargarChat();
    const lista = aportes.filter(a => a.estado === tab);
    if (tab === 'pendiente') lista.sort((a, b) => analizar(b).groserias.length - analizar(a).groserias.length || new Date(a.created_at) - new Date(b.created_at));
    if (!lista.length) { $('#cola').innerHTML = `<div class="vacio-cola">${tab === 'pendiente' ? '🎉 No hay aportes por revisar.' : 'Nada aquí todavía.'}</div>`; return; }
    $('#cola').innerHTML = lista.map(a => {
      const { groserias, banderas } = analizar(a);
      const cat = CATEGORIAS[a.categoria] || { icono: '❔', nombre: a.categoria };
      const ref = a.poi_ref ? POIS.find(p => p.id === a.poi_ref) : null;
      return `<article class="aporte ${groserias.length ? 'alerta' : ''}" data-id="${esc(a.id)}">
        ${miniMapa(+a.x, +a.y)}
        <div>
          <h3>${resaltar(a.titulo, groserias)}</h3>
          <div class="meta">
            <span>${cat.icono} ${esc(cat.nombre)}</span>
            <span>👤 ${resaltar(a.apodo || 'anónimo', groserias)}</span>
            <span>🕒 ${esc(fechaCorta(a.created_at))}</span>
            <span>📍 ${(+a.x).toFixed(0)}, ${(+a.y).toFixed(0)}</span>
            ${a.tipo === 'correccion' ? `<span>✎ Corrección de: <a href="./#poi=${encodeURIComponent(a.poi_ref || '')}" target="_blank">${esc(ref?.nombre || a.poi_ref)}</a></span>` : ''}
          </div>
          ${groserias.length || banderas.length ? `<div class="banderas">
            ${groserias.length ? `<span class="bandera roja">⚠ Posible grosería: ${groserias.map(esc).join(', ')}</span>` : ''}
            ${banderas.map(b => `<span class="bandera">⚑ ${esc(b)}</span>`).join('')}</div>` : ''}
          <p class="mensaje">${resaltar(a.mensaje, groserias)}</p>
          ${a.video_url ? `<p>🎬 <a href="${esc(urlSegura(a.video_url) || '#')}" target="_blank" rel="noopener noreferrer">${esc(a.video_url)}</a></p>` : ''}
          ${a.nota_admin ? `<p class="tenue">Nota: ${esc(a.nota_admin)}</p>` : ''}
          <form class="editar" hidden>
            <label class="campo">Título<input name="titulo" maxlength="80" value="${esc(a.titulo)}"></label>
            <label class="campo">Categoría<select name="categoria">${Object.entries(CATEGORIAS).map(([id, c]) => `<option value="${id}" ${id === a.categoria ? 'selected' : ''}>${c.icono} ${esc(c.nombre)}</option>`).join('')}</select></label>
            <label class="campo">Mensaje<textarea name="mensaje" rows="3" maxlength="600">${esc(a.mensaje)}</textarea></label>
            <label class="campo">Video<input name="video_url" value="${esc(a.video_url || '')}"></label>
            <label class="campo">Apodo<input name="apodo" maxlength="30" value="${esc(a.apodo || '')}"></label>
          </form>
          <div class="botones">
            ${a.estado !== 'aprobado' ? `<button class="btn aprobar" data-a="aprobar">✓ Aprobar y publicar</button>` : `<button class="btn ghost" data-a="despublicar">↩ Quitar del mapa</button>`}
            ${a.estado === 'pendiente' ? `<button class="btn rechazar" data-a="rechazar">✕ Rechazar</button>` : ''}
            ${a.estado === 'rechazado' ? `<button class="btn ghost" data-a="reabrir">↺ Regresar a pendientes</button>` : ''}
            <button class="btn ghost" data-a="editar">✎ Editar</button>
            <button class="btn ghost" data-a="borrar">🗑 Borrar definitivo</button>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  let idRechazo = null;
  $('#cola').addEventListener('click', async e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const art = b.closest('.aporte'), id = art.dataset.id;
    const formEd = art.querySelector('.editar');
    try {
      switch (b.dataset.a) {
        case 'editar': formEd.hidden = !formEd.hidden; return;
        case 'aprobar': {
          const cambios = { estado: 'aprobado' };
          if (!formEd.hidden) {
            const d = Object.fromEntries(new FormData(formEd));
            if (d.video_url && !Moderacion.videoPermitido(d.video_url)) return toast('El link de video no es de un dominio permitido.');
            Object.assign(cambios, { titulo: d.titulo.trim(), categoria: d.categoria, mensaje: d.mensaje.trim(), video_url: d.video_url.trim() || null, apodo: d.apodo.trim() || null });
          }
          await Store.actualizar(id, cambios); toast('Publicado en el mapa ✓'); break;
        }
        case 'rechazar': idRechazo = id; $('#dlg-rechazo').showModal(); return;
        case 'despublicar': await Store.actualizar(id, { estado: 'pendiente' }); toast('Quitado del mapa; regresó a pendientes'); break;
        case 'reabrir': await Store.actualizar(id, { estado: 'pendiente' }); toast('Regresó a pendientes'); break;
        case 'borrar':
          if (!confirm('¿Borrar este aporte para siempre? No se puede deshacer.')) return;
          await Store.eliminar(id); toast('Borrado'); break;
      }
      await cargar();
    } catch (ex) { toast('Error: ' + ex.message); }
  });

  $('#form-rechazo').addEventListener('submit', async e => {
    const f = e.target;
    if (e.submitter?.value !== 'ok' || !idRechazo) return;
    try {
      await Store.actualizar(idRechazo, { estado: 'rechazado', nota_admin: `${f.motivo.value}${f.nota.value ? ' — ' + f.nota.value : ''}` });
      toast('Rechazado'); f.reset(); idRechazo = null; await cargar();
    } catch (ex) { toast('Error: ' + ex.message); }
  });

  document.addEventListener('click', e => { const d = e.target.closest('[data-cerrar-dlg]'); if (d) d.closest('dialog').close(); });
  document.querySelectorAll('[data-tab]').forEach(t => t.addEventListener('click', () => {
    tab = t.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === t));
    pintar();
  }));
  $('#btn-recargar').addEventListener('click', () => (tab === 'chat' ? cargarChat() : cargar()));

  mostrar();
})();

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

  $('#form-login').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, err = $('#login-error');
    err.hidden = true;
    try { await Store.login(f.email.value.trim(), f.clave.value); f.reset(); mostrar(); }
    catch (ex) { err.textContent = ex.message; err.hidden = false; }
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

  function pintar() {
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
  $('#btn-recargar').addEventListener('click', cargar);

  mostrar();
})();

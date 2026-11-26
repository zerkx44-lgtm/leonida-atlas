/* Utilidades compartidas por el mapa y el panel de administración. */
const MAPA_W = 1000, MAPA_H = 1000;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function urlSegura(u) {
  try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch { return null; }
}

/* Reconoce links de redes sociales y regresa cómo mostrarlos. */
function analizarVideo(url) {
  const segura = urlSegura(url);
  if (!segura) return null;
  const u = new URL(segura);
  const host = u.hostname.replace(/^(www\.|m\.|vm\.|mobile\.)/, '');
  if (host === 'youtube.com' || host === 'youtu.be') {
    let id = host === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v');
    if (!id) { const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]{6,})/); if (m) id = m[2]; }
    if (id && /^[\w-]{6,}$/.test(id)) {
      const t = parseInt((u.searchParams.get('t') || u.searchParams.get('start') || '0').replace(/s$/, ''), 10) || 0;
      return { tipo: 'youtube', id, t, url: segura, red: 'YouTube' };
    }
  }
  if (host === 'tiktok.com') {
    const m = u.pathname.match(/\/video\/(\d+)/);
    if (m) return { tipo: 'tiktok', id: m[1], url: segura, red: 'TikTok' };
    return { tipo: 'link', url: segura, red: 'TikTok' };
  }
  const redes = { 'x.com': 'X', 'twitter.com': 'X', 'instagram.com': 'Instagram', 'facebook.com': 'Facebook', 'fb.watch': 'Facebook', 'twitch.tv': 'Twitch', 'kick.com': 'Kick' };
  const red = Object.entries(redes).find(([d]) => host === d || host.endsWith('.' + d));
  return { tipo: 'link', url: segura, red: red ? red[1] : host };
}

/* HTML de un video: miniatura que carga el reproductor solo al tocarla (más rápido y privado). */
function htmlVideo(v, autor) {
  const info = analizarVideo(v);
  if (!info) return '';
  const credito = autor ? `<span class="tenue">Video de ${esc(autor)}</span>` : '';
  if (info.tipo === 'youtube') {
    return `<figure class="video" data-yt="${esc(info.id)}" data-t="${info.t}">
      <button class="video-thumb" style="background-image:url('https://i.ytimg.com/vi/${esc(info.id)}/hqdefault.jpg')" aria-label="Reproducir video">
        <span class="play">▶</span></button>
      <figcaption>${credito} <a href="${esc(info.url)}" target="_blank" rel="noopener noreferrer">Abrir en YouTube ↗</a></figcaption></figure>`;
  }
  if (info.tipo === 'tiktok') {
    return `<figure class="video" data-tt="${esc(info.id)}">
      <button class="video-thumb tiktok" aria-label="Cargar video de TikTok"><span class="play">▶</span><span>TikTok</span></button>
      <figcaption>${credito} <a href="${esc(info.url)}" target="_blank" rel="noopener noreferrer">Abrir en TikTok ↗</a></figcaption></figure>`;
  }
  return `<a class="btn-red" href="${esc(info.url)}" target="_blank" rel="noopener noreferrer">▶ Ver en ${esc(info.red)} ↗</a> ${credito}`;
}

function activarVideos(raiz) {
  raiz.querySelectorAll('.video .video-thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      const fig = btn.closest('.video');
      let src;
      if (fig.dataset.yt) src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(fig.dataset.yt)}?autoplay=1&start=${parseInt(fig.dataset.t, 10) || 0}`;
      else if (fig.dataset.tt) src = `https://www.tiktok.com/embed/v2/${encodeURIComponent(fig.dataset.tt)}`;
      if (!src) return;
      const ifr = document.createElement('iframe');
      ifr.src = src;
      ifr.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      ifr.allowFullscreen = true;
      ifr.loading = 'lazy';
      ifr.className = fig.dataset.tt ? 'tiktok' : '';
      btn.replaceWith(ifr);
    });
  });
}

function toast(msg, ms = 3200) {
  const t = document.getElementById('toast');
  if (!t) return alert(msg);
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), ms);
}

function fechaCorta(iso) {
  try { return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; }
}

const ESTADOS = {
  confirmado: { txt: 'Confirmado (2+ fuentes)', icono: '✅' },
  una_fuente: { txt: 'Reportado por 1 guía', icono: '📘' },
  rumor: { txt: 'Rumor — sin verificar', icono: '❓' },
  comunidad: { txt: 'Aporte de la comunidad', icono: '👥' },
};

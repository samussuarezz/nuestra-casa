/* PC 3051 — service worker: abre la app sin internet, la actualiza sola y muestra los avisos. */
const VERSION = 'casa-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.hostname.endsWith('supabase.co')) return; // datos siempre en vivo

  // La página: primero la red (para recibir mejoras), si no hay internet la copia guardada
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Tipografías de Google: se guardan la primera vez
  if(url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
      return res;
    })));
    return;
  }

  // Íconos y demás archivos propios: copia guardada y se refresca por detrás
  if(url.origin === self.location.origin){
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if(res.ok){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});

/* ---------- Avisos (Web Push) ---------- */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = {body: e.data ? e.data.text() : ''}; }
  const opts = {
    body: d.body || '',
    icon: './icon-192.png',
    badge: './badge-96.png',
    data: {url: d.url || './'},
    lang: 'es',
  };
  if(d.tag){ opts.tag = String(d.tag); opts.renotify = true; }
  const jobs = [self.registration.showNotification(d.title || 'PC 3051', opts)];
  // número en el ícono de la app: tus tareas de hoy y las atrasadas
  const nav = self.navigator;
  if(typeof d.badge === 'number' && nav && 'setAppBadge' in nav){
    jobs.push((d.badge > 0 ? nav.setAppBadge(d.badge) : nav.clearAppBadge()).catch(() => {}));
  }
  e.waitUntil(Promise.all(jobs));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => {
    for(const c of list){
      if(c.url.startsWith(self.registration.scope) && 'focus' in c){ c.postMessage({type: 'open', url}); return c.focus(); }
    }
    return self.clients.openWindow ? self.clients.openWindow(url) : null;
  }));
});

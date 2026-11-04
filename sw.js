// Service worker do Balcão de Negócios Online
// Ao alterar index.html ou ícones, aumente o número da versão abaixo
// para que os celulares baixem a atualização.
const VERSAO = 'balcao-v1';

const ARQUIVOS_APP = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

// Instala: guarda os arquivos do app no celular
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS_APP)));
  self.skipWaiting();
});

// Ativa: apaga versões antigas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(nomes =>
      Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // Só trata requisições GET do próprio site.
  // Google (login/Drive) e links externos passam direto, sem cache.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // balcao.json e a página: tenta a internet primeiro (dados sempre atuais);
  // sem conexão, usa a última cópia guardada.
  if (url.pathname.endsWith('balcao.json') || req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(resp => {
          if (resp.ok) {
            const copia = resp.clone();
            const chave = url.pathname.endsWith('balcao.json') ? './balcao.json' : req;
            caches.open(VERSAO).then(c => c.put(chave, copia));
          }
          return resp;
        })
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Ícones e demais arquivos: usa o cache, e busca na internet se faltar
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});

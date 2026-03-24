var CACHE = 'ldeluipy-hub-v13';

self.addEventListener('install', function(ev) {
	ev.waitUntil(
		fetch('/')
			.then(function(res) {
				if (!res.ok) throw new Error('nav');
				return caches.open(CACHE).then(function(cache) {
					return Promise.all([
						cache.put('/', res.clone()),
						cache.addAll([
							'/uses.html',
							'/style.css',
							'/primordial.css',
							'/manifest.webmanifest',
							'/data/hub.json',
							'/favicon.svg'
						])
					]);
				});
			})
			.catch(function() {
				return caches.open(CACHE).then(function(cache) {
					return cache.addAll([
						'/uses.html',
						'/style.css',
						'/primordial.css',
						'/manifest.webmanifest',
						'/data/hub.json',
						'/favicon.svg'
					]);
				});
			})
			.then(function() {
				return self.skipWaiting();
			})
	);
});

self.addEventListener('activate', function(ev) {
	ev.waitUntil(
		caches
			.keys()
			.then(function(keys) {
				return Promise.all(
					keys
						.filter(function(k) {
							return k !== CACHE;
						})
						.map(function(k) {
							return caches.delete(k);
						})
				);
			})
			.then(function() {
				return self.clients.claim();
			})
	);
});

function cachePathForUrl(u) {
	var path = u.pathname || '/';
	if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
	return path || '/';
}

self.addEventListener('fetch', function(ev) {
	var req = ev.request;
	var url;
	try {
		url = new URL(req.url);
	} catch (e) {
		return;
	}
	if (url.origin !== self.location.origin) return;

	if (req.mode === 'navigate') {
		var pathKey = cachePathForUrl(url);
		ev.respondWith(
			fetch(req)
				.then(function(res) {
					var copy = res.clone();
					caches.open(CACHE).then(function(cache) {
						cache.put(pathKey === '/' ? '/' : pathKey, copy);
					});
					return res;
				})
				.catch(function() {
					return caches.match(pathKey).then(function(cached) {
						return cached || caches.match('/') || caches.match('/index.html');
					});
				})
		);
		return;
	}

	ev.respondWith(
		caches.match(req).then(function(cached) {
			var net = fetch(req)
				.then(function(res) {
					if (res && res.status === 200 && req.method === 'GET') {
						var copy = res.clone();
						caches.open(CACHE).then(function(cache) {
							cache.put(req, copy);
						});
					}
					return res;
				})
				.catch(function() {
					return cached;
				});
			return cached || net;
		})
	);
});

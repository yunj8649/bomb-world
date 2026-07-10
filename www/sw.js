/* 지뢰천국 서비스 워커 — 앱 셸 오프라인 캐시
   파일 수정 후 배포할 땐 CACHE 버전 문자열을 올려야 새 버전이 반영됨 */
const CACHE = "bombcheon-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./src/style.css",
  "./src/icons.js",
  "./src/game.js",
  "./manifest.webmanifest",
  "./favicon-32.png",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
];

// 설치: 앱 셸 미리 캐시
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// 활성화: 옛 캐시 정리
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리: 캐시 우선(cache-first), 없으면 네트워크 후 캐시에 저장
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match("./index.html")); // 오프라인 폴백
    })
  );
});

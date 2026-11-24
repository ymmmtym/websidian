import { h } from "preact"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")

const DEFAULTS = {
  themeColor: "#284b63",
  backgroundColor: "#faf8f8",
  display: "standalone",
  precache: true,
  icon: "quartz/static/icon.png",
  retire: false,
}

/** Path prefix the site is served under ("" for a domain root, "/repo" for a project page). */
export function basePathOf(cfg) {
  if (!cfg.baseUrl) return ""
  const { pathname } = new URL(`https://${cfg.baseUrl}`)
  return pathname.replace(/\/+$/, "")
}

export function buildManifest(cfg, options = {}) {
  const opts = { ...DEFAULTS, ...options }
  const base = basePathOf(cfg)
  const name = cfg.pageTitle ?? "Quartz"
  const icon = (file, size, purpose) => ({
    src: `${base}/static/pwa/${file}`,
    sizes: `${size}x${size}`,
    type: "image/png",
    purpose,
  })

  return {
    name,
    short_name: name,
    description: `${name} — 技術メモ`,
    lang: cfg.locale ?? "en",
    dir: "ltr",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: opts.display,
    background_color: opts.backgroundColor,
    theme_color: opts.themeColor,
    icons: [
      icon("icon-192.png", 192, "any"),
      icon("icon-512.png", 512, "any"),
      icon("icon-maskable-512.png", 512, "maskable"),
    ],
  }
}

/**
 * `icon.png` is a light logo on white, so the glyph is turned into an alpha mask and drawn in
 * white over the brand colour. Painted directly, a white-on-white icon disappears on home screens.
 */
export async function renderIcon(iconPath, size, { background, padding = 0 }) {
  const inner = Math.round(size * (1 - padding * 2))
  const { data, info } = await sharp(iconPath)
    .flatten({ background: "#ffffff" })
    .greyscale()
    .resize(inner, inner, { fit: "contain", background: "#ffffff" })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const alpha = Buffer.alloc(info.width * info.height)
  for (let i = 0; i < alpha.length; i++) {
    const darkness = 255 - data[i]
    alpha[i] = Math.max(0, Math.min(255, Math.round(((darkness - 90) / 165) * 255)))
  }

  const glyph = await sharp(Buffer.alloc(info.width * info.height * 3, 255), {
    raw: { width: info.width, height: info.height, channels: 3 },
  })
    .joinChannel(alpha, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png()
    .toBuffer()

  const plate = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" fill="${background}"/></svg>`,
  )

  return sharp(plate)
    .composite([{ input: glyph, gravity: "center" }])
    .png()
    .toBuffer()
}

/**
 * A worker that removes itself and the caches it owns. Emitted INSTEAD of the real worker when
 * `retire` is set, so a rollback can reach browsers that already installed one: removing the
 * plugin stops publishing `/sw.js`, and a 404 there leaves the old worker controlling the site
 * until the browser happens to purge it. Serving this at the same URL retires it on the next
 * navigation while the registration is still intact.
 */
export function buildRetirementWorker() {
  return `const CACHE_PREFIX = "pwa-"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)),
      )
      await self.registration.unregister()
      // Reload controlled tabs so they stop running behind a worker that is on its way out.
      const clients = await self.clients.matchAll({ type: "window" })
      await Promise.all(clients.map((client) => client.navigate(client.url).catch(() => {})))
    })(),
  )
})
`
}

export function buildServiceWorker({ cfg, options = {}, buildId }) {
  const opts = { ...DEFAULTS, ...options }
  if (opts.retire) return buildRetirementWorker()
  const base = basePathOf(cfg)
  const cacheName = `pwa-${buildId}`
  const precache = [
    ...(opts.precache ? [`${base}/`] : []),
    `${base}/manifest.webmanifest`,
    `${base}/static/pwa/icon-192.png`,
    `${base}/static/pwa/icon-512.png`,
  ]
  const offline = `<h1>${cfg.pageTitle ?? "Offline"}</h1><p>オフラインです。接続後に再読み込みしてください。</p>`

  return `const CACHE = ${JSON.stringify(cacheName)}
const BASE = ${JSON.stringify(base)}
const PRECACHE = ${JSON.stringify(precache)}
const OFFLINE = ${JSON.stringify(offline)}
const CACHE_PREFIX = "pwa-"

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {}),
        ),
      )
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

// Pages are fetched without an extension (Quartz serves /foo/bar from foo/bar.html), and the SPA
// fetches them with plain fetch() rather than a navigation request, so the Accept header is useless.
const looksLikePage = (pathname) => !/\\.[a-z0-9]+$/i.test(pathname)

async function put(cache, request, response) {
  if (response.ok) await cache.put(request, response.clone()).catch(() => {})
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const response = await fetch(request)
    await put(cache, request, response)
    return response
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true })
    if (cached) return cached
    return new Response(OFFLINE, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    })
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request, { ignoreSearch: true })
  const network = fetch(request)
    .then(async (response) => {
      await put(cache, request, response)
      return response
    })
    // Without this the handler would resolve to undefined and respondWith() would throw.
    .catch(() => cached ?? new Response("", { status: 504 }))
  return cached ?? network
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.endsWith("/sw.js")) return
  if (!url.pathname.startsWith(BASE + "/") && url.pathname !== BASE) return

  const isPage = request.mode === "navigate" || looksLikePage(url.pathname)
  event.respondWith(isPage ? networkFirst(request) : staleWhileRevalidate(request))
})
`
}

function registerScript(base) {
  return `if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(${JSON.stringify(`${base}/sw.js`)}, {
    scope: ${JSON.stringify(`${base}/`)},
  }).catch(() => {})
}`
}

function headTags(cfg, options) {
  const opts = { ...DEFAULTS, ...options }
  const base = basePathOf(cfg)
  const name = cfg.pageTitle ?? "Quartz"

  return [
    h("link", { rel: "manifest", href: `${base}/manifest.webmanifest` }),
    h("meta", { name: "theme-color", content: opts.themeColor }),
    h("meta", { name: "mobile-web-app-capable", content: "yes" }),
    h("meta", { name: "apple-mobile-web-app-capable", content: "yes" }),
    h("meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" }),
    h("meta", { name: "apple-mobile-web-app-title", content: name }),
    h("link", {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: `${base}/static/pwa/apple-touch-icon.png`,
    }),
  ]
}

async function write(ctx, relPath, content) {
  const target = path.join(ctx.argv.output, relPath)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, content)
  return target
}

export const PWA = (userOptions = {}) => {
  const options = { ...DEFAULTS, ...userOptions }

  return {
    name: "PWA",
    async *emit(ctx) {
      const { cfg } = ctx
      if (options.retire) {
        yield await write(ctx, "sw.js", buildRetirementWorker())
        return
      }
      const iconPath = path.resolve(REPO_ROOT, options.icon)
      // Icons draw the logo in white, so the plate is the brand colour rather than the
      // near-white splash background, which would leave the glyph invisible.
      const background = options.themeColor

      yield await write(
        ctx,
        "manifest.webmanifest",
        JSON.stringify(buildManifest(cfg.configuration, options), null, 2),
      )

      const icons = [
        ["icon-192.png", 192, 0],
        ["icon-512.png", 512, 0],
        ["icon-maskable-512.png", 512, 0.2],
        ["apple-touch-icon.png", 180, 0.06],
      ]
      for (const [file, size, padding] of icons) {
        const png = await renderIcon(iconPath, size, { background, padding })
        yield await write(ctx, path.join("static", "pwa", file), png)
      }

      yield await write(
        ctx,
        "sw.js",
        buildServiceWorker({ cfg: cfg.configuration, options, buildId: ctx.buildId }),
      )
    },
    async partialEmit() {
      return null
    },
    externalResources(ctx) {
      // A retiring deployment only serves the worker that shuts the old one down. Advertising a
      // manifest would invite fresh installs of a PWA that is being withdrawn.
      if (options.retire) return {}
      const resources = { additionalHead: [() => headTags(ctx.cfg.configuration, options)] }
      // The dev server reloads through its own websocket; a worker in front of it only gets in the way.
      if (ctx.argv.serve) return resources
      return {
        ...resources,
        js: [
          {
            loadTime: "afterDOMReady",
            contentType: "inline",
            script: registerScript(basePathOf(ctx.cfg.configuration)),
          },
        ],
      }
    },
  }
}

export default PWA

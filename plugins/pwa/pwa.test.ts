import test, { describe } from "node:test"
import assert from "node:assert"
import { basePathOf, buildManifest, buildServiceWorker } from "./dist/index.js"

const domainRoot = { baseUrl: "websidian.example.com", pageTitle: "Websidian", locale: "ja-JP" }
const projectPage = {
  baseUrl: "example.github.io/websidian",
  pageTitle: "Websidian",
  locale: "ja-JP",
}

describe("basePathOf", () => {
  test("is empty for a domain root", () => {
    assert.strictEqual(basePathOf(domainRoot), "")
  })

  test("is the subpath for a project page", () => {
    assert.strictEqual(basePathOf(projectPage), "/websidian")
  })

  test("drops a trailing slash so paths do not double up", () => {
    assert.strictEqual(basePathOf({ baseUrl: "example.github.io/websidian/" }), "/websidian")
  })

  test("is empty without a baseUrl", () => {
    assert.strictEqual(basePathOf({}), "")
  })
})

describe("buildManifest", () => {
  test("uses the site title and locale", () => {
    const manifest = buildManifest(domainRoot)
    assert.strictEqual(manifest.name, "Websidian")
    assert.strictEqual(manifest.short_name, "Websidian")
    assert.strictEqual(manifest.lang, "ja-JP")
  })

  test("serves from the root of a custom domain", () => {
    const manifest = buildManifest(domainRoot)
    assert.strictEqual(manifest.start_url, "/")
    assert.strictEqual(manifest.scope, "/")
    assert.deepStrictEqual(
      manifest.icons.map((icon) => icon.src),
      ["/static/pwa/icon-192.png", "/static/pwa/icon-512.png", "/static/pwa/icon-maskable-512.png"],
    )
  })

  test("scopes a project page to its subpath", () => {
    const manifest = buildManifest(projectPage)
    assert.strictEqual(manifest.start_url, "/websidian/")
    assert.strictEqual(manifest.scope, "/websidian/")
    assert.strictEqual(manifest.icons[0].src, "/websidian/static/pwa/icon-192.png")
  })

  test("marks exactly one icon maskable so Android does not crop the glyph", () => {
    const maskable = buildManifest(domainRoot).icons.filter((icon) => icon.purpose === "maskable")
    assert.strictEqual(maskable.length, 1)
    assert.strictEqual(maskable[0].sizes, "512x512")
  })

  test("applies option overrides", () => {
    const manifest = buildManifest(domainRoot, {
      themeColor: "#000000",
      display: "fullscreen",
    })
    assert.strictEqual(manifest.theme_color, "#000000")
    assert.strictEqual(manifest.display, "fullscreen")
  })
})

describe("buildServiceWorker", () => {
  const sw = buildServiceWorker({ cfg: domainRoot, buildId: "abc123" })

  test("names the cache after the build so a deploy invalidates it", () => {
    assert.match(sw, /const CACHE = "pwa-abc123"/)
  })

  test("precaches the start URL and the manifest", () => {
    assert.match(sw, /const PRECACHE = \["\/","\/manifest\.webmanifest"/)
  })

  test("only deletes caches belonging to this plugin", () => {
    assert.match(sw, /CACHE_PREFIX = "pwa-"/)
    assert.match(sw, /key\.startsWith\(CACHE_PREFIX\) && key !== CACHE/)
  })

  test("skips precaching the start URL when precache is off", () => {
    const off = buildServiceWorker({
      cfg: domainRoot,
      buildId: "abc123",
      options: { precache: false },
    })
    assert.match(off, /const PRECACHE = \["\/manifest\.webmanifest"/)
  })

  test("never leaves a fetch handler without a response when offline", () => {
    assert.doesNotMatch(sw, /\.catch\(\(\) => cached\)\n/)
    assert.match(sw, /\.catch\(\(\) => cached \?\? new Response\("", \{ status: 504 \}\)\)/)
  })

  test("only handles same-origin GETs, leaving the dev websocket alone", () => {
    assert.match(sw, /if \(request\.method !== "GET"\) return/)
    assert.match(sw, /if \(url\.origin !== self\.location\.origin\) return/)
    assert.match(sw, /if \(url\.pathname\.endsWith\("\/sw\.js"\)\) return/)
  })
})

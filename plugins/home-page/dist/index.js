import { h } from "preact"
import { resolveRelative } from "@quartz-community/utils"

/** 公開対象のノートだけを一覧に出す（タグ／フォルダの索引ページは除外） */
function isPublishedNote(data) {
  const slug = data.slug
  const relativePath = data.relativePath ?? data.filePath
  if (!slug || slug === "index" || slug === "404") return false
  if (slug.startsWith("tags/") || slug.endsWith("/index")) return false
  if (data.unlisted === true || data.frontmatter?.unlisted === true) return false
  if (!relativePath?.endsWith(".md")) return false
  return true
}

function HomeBody({ allFiles, fileData }) {
  const pages = allFiles
    .filter(isPublishedNote)
    .sort((a, b) =>
      (a.frontmatter?.title ?? a.slug).localeCompare(b.frontmatter?.title ?? b.slug, "ja"),
    )

  return h(
    "div",
    { class: "home-page" },
    h("p", null, "Obsidian Vault で管理している技術メモを静的サイトとして公開しています。"),
    h("h2", null, "ノート"),
    h(
      "ul",
      { class: "home-notes" },
      pages.map((page) =>
        h(
          "li",
          { key: page.slug },
          h(
            "a",
            { class: "internal", href: resolveRelative(fileData.slug, page.slug) },
            page.frontmatter?.title ?? page.slug,
          ),
        ),
      ),
    ),
  )
}

export default () => ({
  name: "HomePage",
  priority: 20,
  match: () => false,
  generate({ cfg }) {
    const title = cfg.pageTitle ?? "Home"
    return [
      {
        slug: "index",
        title,
        data: {
          frontmatter: { title, tags: [] },
        },
      },
    ]
  },
  layout: "home",
  body: () => HomeBody,
})

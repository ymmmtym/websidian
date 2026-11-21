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

/** タグページ（tags/index を除く）を一覧に出す */
function isTagPage(data) {
  return Boolean(
    data.slug?.startsWith("tags/") && data.slug !== "tags/index" && data.unlisted !== true,
  )
}

function titleOf(data) {
  return data.frontmatter?.title ?? data.slug.replace(/^tags\//, "").replace(/\/index$/, "")
}

function LinkList({ items, className, fileData, linkClass = "internal" }) {
  return h(
    "ul",
    { class: className },
    items.map((item) =>
      h(
        "li",
        { key: item.slug },
        h(
          "a",
          { class: linkClass, href: resolveRelative(fileData.slug, item.slug) },
          titleOf(item),
        ),
      ),
    ),
  )
}

function HomeBody({ allFiles, fileData }) {
  const pages = allFiles
    .filter(isPublishedNote)
    .sort((a, b) => titleOf(a).localeCompare(titleOf(b), "ja"))
  const tags = allFiles.filter(isTagPage).sort((a, b) => titleOf(a).localeCompare(titleOf(b), "ja"))

  return h(
    "div",
    { class: "home-page" },
    h("p", null, "Obsidian Vault で管理している技術メモを静的サイトとして公開しています。"),
    h("h2", null, "ノート"),
    h(LinkList, { items: pages, className: "home-notes", fileData }),
    h("h2", null, "タグ"),
    h(LinkList, {
      items: tags,
      className: "home-tags",
      fileData,
      linkClass: "internal tag-link",
    }),
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

import type { GlobalConfiguration, QuartzEmitterPlugin } from "@quartz-community/types"

export interface PWAOptions {
  themeColor?: string
  backgroundColor?: string
  display?: "fullscreen" | "standalone" | "minimal-ui" | "browser"
  precache?: boolean
  icon?: string
  retire?: boolean
}

export interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose: string
}

export interface WebAppManifest {
  name: string
  short_name: string
  description: string
  lang: string
  dir: "ltr"
  start_url: string
  scope: string
  display: NonNullable<PWAOptions["display"]>
  background_color: string
  theme_color: string
  icons: ManifestIcon[]
}

export declare function basePathOf(cfg: GlobalConfiguration): string

export declare function buildManifest(
  cfg: GlobalConfiguration,
  options?: PWAOptions,
): WebAppManifest

export declare function renderIcon(
  iconPath: string,
  size: number,
  opts: { background: string; padding?: number },
): Promise<Buffer>

export declare function buildRetirementWorker(): string

export declare function buildServiceWorker(args: {
  cfg: GlobalConfiguration
  options?: PWAOptions
  buildId: string
}): string

export declare const PWA: QuartzEmitterPlugin<PWAOptions>
export default PWA

export { type ManifestIcon, type PWAOptions, type WebAppManifest }

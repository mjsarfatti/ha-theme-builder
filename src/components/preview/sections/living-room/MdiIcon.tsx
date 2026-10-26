import type { CSSProperties } from "react"

interface MdiIconProps {
  /** An SVG path from `@mdi/js`, for example `mdiLightbulb`. */
  path: string
  className?: string
  style?: CSSProperties
}

/**
 * Decorative Material Design icon in `currentColor`, as `ha-svg-icon` renders it.
 *
 * @example
 * <MdiIcon path={mdiLightbulb} className="size-5" />
 */
export function MdiIcon({ path, className, style }: MdiIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} style={style}>
      <path d={path} fill="currentColor" />
    </svg>
  )
}

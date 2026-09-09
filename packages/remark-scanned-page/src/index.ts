export {
  DEFAULT_TAG,
  MARK_NAME,
  THEME_NAME,
  remarkMarkDirective,
  type RemarkMarkDirectiveOptions,
} from './remark-mark-directive'

export { renderMarkdown, schema } from './render'

export { wrapSelection, type WrapResult } from './wrap-selection'

export { ScannedPage, type ScannedPageProps } from './scanned-page'

/**
 * Colour maths, exported because filling in the palette is the one job this
 * package hands back to whoever installs it. `meetsAA` is what turns "these
 * colours look fine" into a test — measured against the highlight fill, not
 * the page background, since a `<mark>` paints over the canvas.
 */
export {
  AA_LARGE,
  AA_NORMAL,
  contrastRatio,
  hexToRgb,
  meetsAA,
  relativeLuminance,
  type Rgb,
} from './contrast'

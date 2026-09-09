export {
  DEFAULT_TAG,
  MARK_NAME,
  PASSAGE_NAME,
  THEME_NAME,
  remarkMarkDirective,
  type RemarkMarkDirectiveOptions,
} from './remark-mark-directive'

export { renderMarkdown, schema } from './render'

/**
 * Regions. A passage says which band of the sheet it was written on, which is
 * what makes a transcription *synchronised* rather than merely adjacent.
 *
 * `parseRegion` is the only thing that reads an `at` attribute, and it comes
 * from markdown that came from a vision model — so it degrades to `null`
 * rather than throwing, and `bandFor` is what fills the gap.
 */
export {
  MIN_BAND,
  bandFor,
  parseRegion,
  regionFor,
  type Region,
} from './passage'

export {
  wrapPassage,
  wrapSelection,
  type PassageResult,
  type WrapResult,
} from './wrap-selection'

export {
  ScannedPage,
  ScannedPhoto,
  ScannedTranscription,
  type ScannedPageProps,
} from './scanned-page'

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

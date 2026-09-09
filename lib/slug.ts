/**
 * Letter slugs: three readable words plus a random token.
 *
 * They have to be two things at once: readable enough to dictate, and
 * unguessable, so a letter written for one person cannot be stumbled onto by
 * another.
 *
 * Words alone do not achieve the second part. Three words from lists this
 * size give about 330,000 combinations — roughly 2^18, which a script walks
 * through in an afternoon. That is not a small margin, it is no margin, so
 * the words carry the readability and a 6-character token carries the
 * entropy. Together it is about 2^48.
 *
 * If the word lists are ever trimmed, the token is what keeps this safe.
 * Don't remove it to make the URL prettier.
 *
 * Uniqueness is still enforced by a unique index on `letters.slug`. A
 * generator that "won't collide" is an assumption; the index is a guarantee.
 */

const ADJECTIVES = [
  'amber', 'ancient', 'autumn', 'bitter', 'blue', 'bold', 'brave', 'bright',
  'calm', 'clever', 'copper', 'crimson', 'curious', 'damp', 'dawn', 'deep',
  'distant', 'dusty', 'eager', 'early', 'empty', 'faint', 'first', 'foggy',
  'frozen', 'gentle', 'golden', 'grand', 'green', 'hidden', 'hollow', 'humble',
  'idle', 'ivory', 'jolly', 'keen', 'late', 'lilac', 'little', 'lonely',
  'loud', 'lucky', 'mellow', 'merry', 'misty', 'muted', 'narrow', 'noble',
  'northern', 'olive', 'patient', 'plain', 'polite', 'proud', 'quiet', 'rapid',
  'restless', 'rough', 'round', 'royal', 'rusty', 'salty', 'scarlet', 'shy',
  'silent', 'silver', 'slender', 'small', 'smooth', 'snowy', 'soft', 'solemn',
  'sour', 'spare', 'spring', 'steady', 'still', 'stormy', 'sunny', 'sweet',
  'tender', 'thirsty', 'tidy', 'timid', 'tiny', 'twin', 'velvet', 'wandering',
  'warm', 'weathered', 'wild', 'winter', 'wise', 'wooden', 'young',
]

const NOUNS = [
  'anchor', 'apple', 'arbour', 'attic', 'basket', 'beacon', 'bell', 'bird',
  'blanket', 'bloom', 'brook', 'bureau', 'candle', 'canvas', 'cedar', 'cellar',
  'chapel', 'clover', 'comet', 'compass', 'cottage', 'creek', 'daisy', 'dawn',
  'desk', 'ember', 'fable', 'feather', 'fern', 'ferry', 'fig', 'forest',
  'garden', 'gate', 'glass', 'grove', 'harbour', 'harvest', 'hazel', 'heron',
  'hollow', 'ink', 'island', 'ivy', 'jasmine', 'kettle', 'ladder', 'lamp',
  'lantern', 'ledger', 'letter', 'lilac', 'linen', 'maple', 'marble', 'meadow',
  'mirror', 'moss', 'mountain', 'needle', 'nest', 'orchard', 'otter', 'owl',
  'paper', 'parlour', 'pebble', 'pigeon', 'pine', 'pocket', 'pond', 'poppy',
  'quill', 'rabbit', 'ribbon', 'river', 'robin', 'sage', 'sailor', 'shelf',
  'shore', 'sparrow', 'spruce', 'stairs', 'stone', 'stove', 'swallow', 'table',
  'thistle', 'thread', 'tide', 'trellis', 'valley', 'violet', 'walnut',
  'willow', 'window', 'wren',
]

const SUFFIXES = [
  'april', 'ash', 'bay', 'birch', 'cove', 'dune', 'east', 'elm', 'fern',
  'field', 'ford', 'glen', 'hill', 'june', 'lane', 'march', 'may', 'mill',
  'moor', 'north', 'oak', 'path', 'pier', 'reed', 'ridge', 'row', 'sky',
  'south', 'stead', 'street', 'thorn', 'vale', 'view', 'west', 'wood', 'yard',
]

/**
 * Token alphabet. No `0`/`o`, no `1`/`l`: the slug is meant to survive being
 * read out loud or copied by hand.
 */
const TOKEN_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'

const TOKEN_LENGTH = 6

export const SLUG_COMBINATIONS =
  ADJECTIVES.length *
  NOUNS.length *
  SUFFIXES.length *
  TOKEN_ALPHABET.length ** TOKEN_LENGTH

/** Matches a slug this generator could have produced. */
export const SLUG_PATTERN = new RegExp(
  `^[a-z]+-[a-z]+-[a-z]+-[${TOKEN_ALPHABET}]{${TOKEN_LENGTH}}$`,
)

function pick<T>(list: readonly T[], random: () => number): T {
  // Math.min guards the 0.999… case, which would otherwise index past the end.
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))]
}

/**
 * Cryptographically random by default. `Math.random` is predictable enough
 * that a determined reader could enumerate slugs, which is exactly the
 * property these are supposed to have.
 */
function secureRandom(): number {
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return buffer[0] / 2 ** 32
}

function token(random: () => number): string {
  let out = ''
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    out += pick(TOKEN_ALPHABET.split(''), random)
  }
  return out
}

export function generateSlug(random: () => number = secureRandom): string {
  return [
    pick(ADJECTIVES, random),
    pick(NOUNS, random),
    pick(SUFFIXES, random),
    token(random),
  ].join('-')
}

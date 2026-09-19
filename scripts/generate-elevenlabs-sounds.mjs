import { mkdir, access, writeFile } from 'node:fs/promises'
import { loadEnvFile } from 'node:process'

try {
  loadEnvFile('.env.local')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

const effects = {
  tear: {
    duration: 1.2,
    prompt:
      'A single close-miked delicate paper envelope tear. A short dry fibrous rip from left to right, then a soft paper rustle. Intimate, gentle tactile stationery foley, quiet room, completely dry recording. Starts immediately, crisp but soft, no harsh transient, no voice, no music, no ambience, no reverb.',
  },
  turn: {
    duration: 0.65,
    prompt:
      'One gentle turn of a single thick cotton writing paper sheet. A quick soft papery flutter and light contact as it settles on a stack of letters. Close-miked intimate tactile stationery foley, starts immediately, completely dry, quiet and delicate. No voice, no music, no ambience, no reverb, no electronic sound.',
  },
}
const force = process.argv.includes('--force')
const names = process.argv.slice(2).filter((arg) => arg !== '--force')
if (names.some((name) => !Object.hasOwn(effects, name)))
  throw new Error('Choose tear or turn.')
await mkdir('public/sounds', { recursive: true })
for (const name of names.length ? names : Object.keys(effects)) {
  const path = `public/sounds/paper-${name}.mp3`
  const exists = await access(path).then(
    () => true,
    () => false,
  )
  if (exists && !force) {
    console.log(`skip ${path} (use --force to replace)`)
    continue
  }
  const key = process.env.ELEVENLABS_API_KEY
  if (!key)
    throw new Error('ELEVENLABS_API_KEY is required only to generate sounds.')
  const effect = effects[name]
  const response = await fetch(
    'https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',
    {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: effect.prompt,
        duration_seconds: effect.duration,
        prompt_influence: 0.45,
        model_id: 'eleven_text_to_sound_v2',
      }),
      signal: AbortSignal.timeout(60000),
    },
  )
  // Do not echo provider responses or headers: errors must not reveal credentials.
  if (!response.ok)
    throw new Error(`${name}: ElevenLabs returned HTTP ${response.status}`)
  const audio = Buffer.from(await response.arrayBuffer())
  if (
    !response.headers.get('content-type')?.startsWith('audio/') ||
    audio.length < 100
  )
    throw new Error(`${name}: expected audio`)
  await writeFile(path, audio)
  console.log(`Generated ${path} (${Math.ceil(audio.length / 1024)} KB)`)
}

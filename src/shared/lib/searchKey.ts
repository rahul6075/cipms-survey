/**
 * Script- and spelling-insensitive search keys, so a filter typed in English
 * matches answers written in Hindi and vice versa ("Tharauli" ~ "थरौली").
 *
 * Both scripts are reduced to the same Latin skeleton: Devanagari is
 * transliterated, then spelling variation that Hindi speakers use loosely when
 * writing in Latin (aspiration, vowel length, short "a", doubled letters…) is
 * flattened. Pure and dependency-free: used by the Response model, the
 * responses API and unit tests.
 */

/** Bump when the algorithm changes; stored keys with an older version get rebuilt. */
export const SEARCH_KEY_VERSION = 1

const CONSONANTS: Record<string, string> = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "n",
  "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "n",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
  "य": "y", "र": "r", "ल": "l", "ळ": "l", "व": "v",
  "श": "sh", "ष": "sh", "स": "s", "ह": "h",
}

/** Consonant + nukta (़) sounds: ड़ is a flap usually written "r", ज़ is "z", etc. */
const NUKTA: Record<string, string> = {
  "क": "q", "ख": "kh", "ग": "g", "ज": "z", "ड": "r", "ढ": "rh", "फ": "f", "य": "y",
}

const VOWELS: Record<string, string> = {
  "अ": "a", "आ": "aa", "इ": "i", "ई": "ii", "उ": "u", "ऊ": "uu", "ऋ": "ri", "ॠ": "rii",
  "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "ऍ": "e", "ऑ": "o", "ऎ": "e", "ऒ": "o",
}

const MATRAS: Record<string, string> = {
  "ा": "aa", "ि": "i", "ी": "ii", "ु": "u", "ू": "uu", "ृ": "ri", "ॄ": "rii",
  "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॅ": "e", "ॉ": "o", "ॆ": "e", "ॊ": "o",
}

const VIRAMA = "्"
const NUKTA_SIGN = "़"
const DANDA = /[।॥]/

function isDevanagariLetterOrSign(ch: string | undefined): boolean {
  return !!ch && ch >= "ऀ" && ch <= "ॿ" && !DANDA.test(ch)
}

/** Devanagari → loose Latin. Non-Devanagari text passes through unchanged. */
export function transliterateDevanagari(input: string): string {
  // NFD splits precomposed nukta letters (ड़ U+095C → ड + ़) so one path handles both.
  const s = input.normalize("NFD").replace(/ज्ञ/g, "ग्य")
  let out = ""
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    const cons = CONSONANTS[c]
    if (cons !== undefined) {
      let base = cons
      let j = i + 1
      if (s[j] === NUKTA_SIGN) { base = NUKTA[c] ?? cons; j++ }
      const next = s[j]
      if (next !== undefined && MATRAS[next] !== undefined) { out += base + MATRAS[next]; i = j }
      else if (next === VIRAMA) { out += base; i = j }
      // Inherent "a", except at the end of a word (Hindi drops it there).
      else { out += base + (isDevanagariLetterOrSign(next) ? "a" : ""); i = j - 1 }
      continue
    }
    if (VOWELS[c] !== undefined) { out += VOWELS[c]; continue }
    if (c === "ं" || c === "ँ") { out += "n"; continue }
    if (c === "ः") { out += "h"; continue }
    if (c >= "०" && c <= "९") { out += String(c.charCodeAt(0) - 0x0966); continue }
    if (c === VIRAMA || c === NUKTA_SIGN || c === "ऽ") continue
    out += DANDA.test(c) ? " " : c
  }
  return out
}

/**
 * The comparable key for a value. Equal keys mean "probably the same word,
 * possibly in a different script or spelling".
 */
export function toSearchKey(value: string): string {
  let s = transliterateDevanagari(value)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
  s = s.replace(/x/g, "ks").replace(/q/g, "k").replace(/z/g, "j").replace(/f/g, "p")
  // Vowel length and diphthong spellings.
  s = s.replace(/aa/g, "a").replace(/ee|ii/g, "i").replace(/oo|uu/g, "u")
    .replace(/ai/g, "e").replace(/au|ou|ow/g, "o")
  s = s.replace(/w/g, "v")
  // A word-final y is a vowel: Chaudhary ~ चौधरी, Pandey ~ पांडेय.
  s = s.replace(/y\b/g, "i")
  // Aspiration: kh/gh/ch/jh/th/dh/ph/bh/sh… collapse to the plain consonant.
  for (let prev = ""; prev !== s;) { prev = s; s = s.replace(/([bcdgjklmnprstv])h/g, "$1") }
  s = s.replace(/m(?=[pb])/g, "n")
  // Short "a" is the most loosely written vowel (Boknar ~ बोकनार), so drop it,
  // except at the start of a word where it carries the word (Acha ~ अच्छा).
  // Words are then joined so spacing differences don't matter.
  s = s.split(/[^a-z0-9]+/)
    .map((w) => (w.length > 1 ? w[0] + w.slice(1).replace(/a/g, "") : w))
    .join("")
  return s.replace(/([a-z])\1+/g, "$1")
}

export type KeyMatchMode = "contains" | "equals" | "startsWith" | "endsWith"

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/**
 * Regex (source string) to match a query against stored keys, or null when the
 * query's key is too short to be meaningful (it would match almost everything).
 */
export function searchKeyPattern(query: string, mode: KeyMatchMode = "contains"): string | null {
  const key = toSearchKey(query)
  if (key.length < 2) return null
  // Every "a" left in a key starts a word, and word breaks are written
  // inconsistently ("रामअजोर" vs "राम अज़ोर"). So the query tolerates an extra
  // word-initial "a" between any two letters, and its own "a"s are optional
  // when enough other letters remain to keep it specific ("acha" → "ac" keeps
  // its "a" instead of matching every "c").
  const optionalA = key.replace(/a/g, "").length >= 2
  const body = [...key].map((c) => (c === "a" && optionalA ? "a?" : esc(c))).join("a?")
  switch (mode) {
    case "equals": return `^${body}$`
    case "startsWith": return `^${body}`
    case "endsWith": return `${body}$`
    default: return body
  }
}

/**
 * In-memory matcher for short lists (pickers, comboboxes): plain substring
 * match, or the same Hindi/English key match the database filters use.
 */
export function makeSearchMatcher(query: string): (text: string) => boolean {
  const q = query.trim().toLowerCase()
  if (!q) return () => true
  const pattern = searchKeyPattern(query)
  const rx = pattern ? new RegExp(pattern) : null
  return (text) => text.toLowerCase().includes(q) || (rx !== null && rx.test(toSearchKey(text)))
}

/** One key per answer field: text, numbers, option lists and object answers (e.g. constituency). */
export function buildAnswerSearchKeys(answers: Record<string, unknown>): Record<string, string> {
  const keys: Record<string, string> = {}
  for (const [fieldId, value] of Object.entries(answers)) {
    const text = answerText(value)
    if (!text) continue
    const key = toSearchKey(text)
    if (key) keys[fieldId] = key
  }
  return keys
}

function answerText(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string" || typeof v === "number").join(" ")
  if (value && typeof value === "object") {
    return Object.values(value).filter((v) => typeof v === "string" || typeof v === "number").join(" ")
  }
  return ""
}

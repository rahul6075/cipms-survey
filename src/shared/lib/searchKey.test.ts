import { test } from "node:test"
import assert from "node:assert/strict"
import { buildAnswerSearchKeys, makeSearchMatcher, searchKeyPattern, toSearchKey } from "./searchKey"

const matches = (stored: string, query: string) => {
  const pattern = searchKeyPattern(query)
  return pattern !== null && new RegExp(pattern).test(toSearchKey(stored))
}

// Pairs taken from real survey responses: the same word written in English and Hindi.
const SAME_WORD: Array<[string, string]> = [
  ["Tharauli", "थरौली"],
  ["Kanchanpur", "कंचनपुर"],
  ["Boknar", "बोकनार"],
  ["Bankati", "बनकटी"],
  ["Sukrauli", "सुकरौली"],
  ["Akhilesh Pandey", "अखिलेश पांडेय"],
  ["Pandey", "पाण्डेय"],
  ["Hiralal Yadav", "हीरालाल यादव"],
  ["Hansram Yadav", "हंसराम यादव"],
  ["Ramchandra Gaur", "रामचंद्र गौड़"],
  ["Durga Prasad", "दुर्गा प्रसाद"],
  ["Satish", "सतीश"],
  ["Harinath", "हरिनाथ"],
  ["Mishrilal", "मिश्रीलाल"],
  ["Chaudhary", "चौधरी"],
  ["Vishwakarma", "विश्वकर्मा"],
  ["Goswami", "गोस्वामी"],
  ["Gautam", "गौतम"],
  ["Lakshmi", "लक्ष्मी"],
  ["Gyan Das", "ज्ञान दास"],
  ["Mohammad", "मोहम्मद"],
  ["Anita", "अनीता"],
  ["Acha", "अच्छा"],
  ["Rahul", "राहुल"],
  ["Mohan", "मोहन"],
  ["Krishna", "कृष्ण"],
  ["Pooja", "पूजा"],
]

test("English and Hindi spellings of the same word get the same key", () => {
  for (const [en, hi] of SAME_WORD) {
    assert.equal(toSearchKey(en), toSearchKey(hi), `${en} vs ${hi}`)
  }
})

test("a query in either script matches the other script", () => {
  for (const [en, hi] of SAME_WORD) {
    assert.ok(matches(hi, en), `English "${en}" should find "${hi}"`)
    assert.ok(matches(en, hi), `Hindi "${hi}" should find "${en}"`)
  }
})

test("common English spelling variants still match", () => {
  assert.ok(matches("थरौली", "Tharoli"))
  assert.ok(matches("Tharauli ", "tharauli"))
  assert.ok(matches("Satrudhan", "Shatrudhan"))
  assert.ok(matches("रामअजोर", "राम अज़ोर"))
  assert.ok(matches("राम अज़ोर", "रामअजोर"))
  assert.ok(matches("राम अज़ोर", "Ramajor"))
  assert.ok(matches("Siswa Pandey", "siswa pande"))
})

test("different vowels stay different (Siswe is not Siswa)", () => {
  // Treating e/a as equal would merge far too many unrelated words.
  assert.ok(!matches("Siswa Pandey", "siswe"))
})

test("partial words match inside longer values", () => {
  assert.ok(matches("दुर्गा प्रसाद पांडेय", "Pandey"))
  assert.ok(matches("हीरालाल यादव", "yadav"))
  assert.ok(matches("बहुत अच्छा कार्य", "acha"))
  assert.ok(matches("Mohammad Anis", "Anis"))
})

test("different words do not match", () => {
  assert.ok(!matches("थरौली", "Kanchanpur"))
  assert.ok(!matches("Ranipur", "Pipra"))
  assert.ok(!matches("हीरालाल यादव", "Chaudhary"))
  assert.ok(!matches("Sunita", "Anita devi"))
})

test("queries too short to be specific are ignored", () => {
  assert.equal(searchKeyPattern("a"), null)
  assert.equal(searchKeyPattern("ra"), null) // key "r" would match almost everything
  assert.equal(searchKeyPattern("   "), null)
})

test("equals / startsWith / endsWith anchor the key", () => {
  const key = toSearchKey("अखिलेश पांडेय")
  assert.match(key, new RegExp(searchKeyPattern("Akhilesh Pandey", "equals")!))
  assert.match(key, new RegExp(searchKeyPattern("Akhilesh", "startsWith")!))
  assert.match(key, new RegExp(searchKeyPattern("Pandey", "endsWith")!))
  assert.doesNotMatch(key, new RegExp(searchKeyPattern("Pandey", "startsWith")!))
  assert.doesNotMatch(key, new RegExp(searchKeyPattern("Akhilesh", "equals")!))
})

test("answer keys cover text, numbers, option lists and constituency objects", () => {
  const keys = buildAnswerSearchKeys({
    name: "थरौली",
    age: 42,
    picks: ["Farmer", "Student"],
    vs: { state: "Uttar Pradesh", vs_no: 311, vs_name: "Mahadeva", block: "बनकटी" },
    empty: "",
    nothing: null,
  })
  assert.equal(keys.name, toSearchKey("Tharauli"))
  assert.equal(keys.age, "42")
  assert.ok(new RegExp(searchKeyPattern("Bankati")!).test(keys.vs))
  assert.ok(new RegExp(searchKeyPattern("Mahadeva")!).test(keys.vs))
  assert.ok(!("empty" in keys) && !("nothing" in keys))
})

test("picker matcher finds English list names typed in Hindi", () => {
  // Names as they appear in the constituency / block picker data.
  const list = ["Mahadeva", "Basti Sadar", "Kaptanganj", "Bansi", "Domariyaganj", "Gorakhpur Urban", "Bankati", "Sau Ghat", "Khesraha"]
  const find = (q: string) => list.filter(makeSearchMatcher(q))
  assert.deepEqual(find("महादेवा"), ["Mahadeva"])
  assert.deepEqual(find("बस्ती"), ["Basti Sadar"])
  assert.deepEqual(find("कप्तानगंज"), ["Kaptanganj"])
  assert.deepEqual(find("बनकटी"), ["Bankati"])
  assert.deepEqual(find("डुमरियागंज").length, 0) // spelt differently (Domariyaganj), not forced to match
  assert.deepEqual(find("gorakh"), ["Gorakhpur Urban"])
  assert.equal(find("").length, list.length)
})

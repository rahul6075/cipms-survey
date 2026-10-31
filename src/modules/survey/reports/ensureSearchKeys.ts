import { Types } from "mongoose"
import Response from "@/modules/survey/models/Response"
import { buildAnswerSearchKeys, SEARCH_KEY_VERSION } from "@/shared/lib/searchKey"

const BATCH = 500
// Forms already brought up to the current key version in this server process.
const ready = new Set<string>()

/**
 * Fills in missing or outdated search keys for one form's responses. New
 * responses get keys from the model hook; this covers older ones and any bump
 * of SEARCH_KEY_VERSION. Idempotent, so concurrent requests are harmless.
 */
export async function ensureSearchKeys(formId: string): Promise<void> {
  const cacheKey = `${formId}:${SEARCH_KEY_VERSION}`
  if (ready.has(cacheKey)) return
  const filter = { form_id: new Types.ObjectId(formId), search_keys_v: { $ne: SEARCH_KEY_VERSION } }
  for (;;) {
    const docs = await Response.find(filter).select("answers").limit(BATCH)
      .lean<Array<{ _id: Types.ObjectId; answers?: Record<string, unknown> }>>()
    if (docs.length === 0) break
    await Response.bulkWrite(docs.map((d) => ({
      updateOne: {
        filter: { _id: d._id },
        update: { $set: { search_keys: buildAnswerSearchKeys(d.answers ?? {}), search_keys_v: SEARCH_KEY_VERSION } },
      },
    })))
    if (docs.length < BATCH) break
  }
  ready.add(cacheKey)
}

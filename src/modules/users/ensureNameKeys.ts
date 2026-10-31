import { Types } from "mongoose"
import User from "@/modules/users/models/User"
import { SEARCH_KEY_VERSION, toSearchKey } from "@/shared/lib/searchKey"

let ready = false

/** Fills in missing or outdated `name_key`s (users created before keys existed). Idempotent. */
export async function ensureUserNameKeys(): Promise<void> {
  if (ready) return
  const users = await User.find({ name_key_v: { $ne: SEARCH_KEY_VERSION } }).select("name")
    .lean<Array<{ _id: Types.ObjectId; name?: string }>>()
  if (users.length) {
    await User.bulkWrite(users.map((u) => ({
      updateOne: {
        filter: { _id: u._id },
        update: { $set: { name_key: toSearchKey(u.name || ""), name_key_v: SEARCH_KEY_VERSION } },
      },
    })))
  }
  ready = true
}

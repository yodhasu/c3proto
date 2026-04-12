import { get, set, del } from 'idb-keyval'
import type { ID } from '../model/types'

const key = (id: ID) => `media:${id}`

export async function putMedia(id: ID, blob: Blob) {
  await set(key(id), blob)
}

export async function getMedia(id: ID): Promise<Blob | undefined> {
  return await get(key(id))
}

export async function deleteMedia(id: ID) {
  await del(key(id))
}

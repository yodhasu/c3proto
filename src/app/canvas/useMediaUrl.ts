import { useEffect, useState } from 'react'
import { getMedia } from '../store/media'
import type { ID } from '../model/types'

export function useMediaUrl(mediaId?: ID) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    let objectUrl: string | null = null

    async function run() {
      if (!mediaId) {
        setUrl(null)
        return
      }
      const blob = await getMedia(mediaId)
      if (!alive) return
      if (!blob) {
        setUrl(null)
        return
      }
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    }

    run()

    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [mediaId])

  return url
}

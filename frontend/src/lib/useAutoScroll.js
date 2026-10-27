import { useCallback, useEffect, useRef } from 'react'

// Keeps a scrolling list pinned to the newest item, unless the person
// has scrolled up to read older ones.
export function useAutoScroll(trigger) {
  const containerRef = useRef(null)
  const pinned = useRef(true)

  // Called on every scroll: are we (nearly) at the bottom?
  const onScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  // After the list changes, scroll down only if we were pinned.
  useEffect(() => {
    const el = containerRef.current
    if (el && pinned.current) el.scrollTop = el.scrollHeight
  }, [trigger])

  // Call this when I send a message: always follow my own message.
  const jumpToBottom = useCallback(() => {
    pinned.current = true
  }, [])

  return { containerRef, onScroll, jumpToBottom }
}
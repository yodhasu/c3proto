export type Viewport = { x: number; y: number; scale: number }

export function screenToWorld(
  p: { x: number; y: number },
  viewport: Viewport,
  containerRect: DOMRect,
) {
  return {
    x: (p.x - containerRect.left - viewport.x) / viewport.scale,
    y: (p.y - containerRect.top - viewport.y) / viewport.scale,
  }
}

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

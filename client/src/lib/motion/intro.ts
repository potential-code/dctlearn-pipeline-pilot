/**
 * Seconds until the first-load intro overlay (PrototypeChrome) has cleared, so load reveals
 * start as the page appears rather than behind the overlay. 0 on later navigations.
 */
export const introDelay = () => Math.max(0, 1.25 - performance.now() / 1000)

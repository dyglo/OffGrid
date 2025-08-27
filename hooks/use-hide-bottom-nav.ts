"use client"

import { useEffect } from "react"

export default function useHideBottomNav() {
  useEffect(() => {
    if (typeof window === "undefined") return
    // include tablet sizes (<= 1024px) so the nav hides for mobile+tablet
    const isSmallOrTablet = window.matchMedia && window.matchMedia("(max-width: 1024px)").matches
    if (!isSmallOrTablet) return

    window.dispatchEvent(new CustomEvent("offgrid:bottom-nav", { detail: { hidden: true } }))

    return () => {
      window.dispatchEvent(new CustomEvent("offgrid:bottom-nav", { detail: { hidden: false } }))
    }
  }, [])
}

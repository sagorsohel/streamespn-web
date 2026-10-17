"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface ScrollableSidebarListProps {
  children: React.ReactNode
  className?: string
  maxHeightClass?: string
  scrollStep?: number
  label?: string
  dependency?: any
}

export const ScrollableSidebarList: React.FC<ScrollableSidebarListProps> = ({
  children,
  className = "",
  maxHeightClass = "max-h-[70vh]",
  scrollStep = 240,
  label = "More Leagues",
  dependency,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const checkScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    // 8px threshold for sub-pixel accuracy
    const hasMoreDown = scrollHeight - (scrollTop + clientHeight) > 8
    const hasMoreUp = scrollTop > 8
    setCanScrollUp(hasMoreUp)
    setCanScrollDown(hasMoreDown)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    checkScroll()

    el.addEventListener("scroll", checkScroll, { passive: true })

    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        checkScroll()
      })
      ro.observe(el)
    }

    const onResize = () => checkScroll()
    window.addEventListener("resize", onResize)

    const t1 = setTimeout(checkScroll, 100)
    const t2 = setTimeout(checkScroll, 400)
    const t3 = setTimeout(checkScroll, 1000)

    return () => {
      el.removeEventListener("scroll", checkScroll)
      if (ro) ro.disconnect()
      window.removeEventListener("resize", onResize)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [checkScroll, dependency])

  const handleScrollDown = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: scrollStep, behavior: "smooth" })
    }
  }

  const handleScrollUp = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: -scrollStep, behavior: "smooth" })
    }
  }

  return (
    <div className="relative w-full">
      {/* TOP SCROLL INDICATOR & FADE */}
      {canScrollUp && (
        <>
          <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-10 bg-gradient-to-b from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent transition-opacity duration-200" />
          <div className="pointer-events-none absolute top-1 right-0 left-0 z-20 flex justify-center">
            <button
              type="button"
              onClick={handleScrollUp}
              aria-label="Scroll up"
              className="pointer-events-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-400/30 bg-gray-600/90 text-white shadow-md transition-all hover:scale-110 hover:bg-gray-500 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <ChevronUp className="h-4 w-4 text-black  stroke-[2.5]" />
            </button>
          </div>
        </>
      )}

      {/* SCROLLABLE LIST CONTAINER */}
      <div
        ref={containerRef}
        className={`thin-scrollbar overflow-y-auto ${maxHeightClass} ${className}`}
      >
        {children}
      </div>

      {/* BOTTOM SCROLL INDICATOR (DOWN ARROW BUTTON & FADE) */}
      {canScrollDown && (
        <>
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-12 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/85 to-transparent transition-opacity duration-200" />
          <div className="pointer-events-none absolute right-0 bottom-1.5 left-0 z-20 flex justify-center">
            <button
              type="button"
              onClick={handleScrollDown}
              aria-label="Scroll down"
              className="pointer-events-auto flex h-8 w-8 animate-bounce cursor-pointer items-center justify-center rounded-full border border-gray-400/40 bg-gray-600/90 text-white shadow-lg transition-all hover:scale-110 hover:bg-gray-500 active:scale-95 dark:border-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              <ChevronDown className="h-4.5 w-4.5 stroke-[2.5] text-black" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

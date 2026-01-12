"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div
        className={cn(
          "flex w-20 h-10 p-1 rounded-full",
          "bg-zinc-900 border border-zinc-700",
          className
        )}
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  const handleToggle = () => {
    setIsAnimating(true)
    setTheme(isDark ? "light" : "dark")
    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <div
      className={cn(
        "relative flex w-20 h-10 p-1 rounded-full cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95",
        isDark
          ? "bg-zinc-900 border border-zinc-700 hover:bg-zinc-800"
          : "bg-zinc-100 border border-zinc-300 hover:bg-zinc-200",
        className
      )}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleToggle()
        }
      }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Background icons - always visible */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5">
        <div className="flex justify-center items-center w-8 h-8">
          <Moon
            className={cn(
              "w-4 h-4 transition-all duration-300",
              isDark ? "text-white" : "text-zinc-400",
              isAnimating && isDark && "rotate-12 scale-110"
            )}
            strokeWidth={1.5}
          />
        </div>
        <div className="flex justify-center items-center w-8 h-8">
          <Sun
            className={cn(
              "w-4 h-4 transition-all duration-300",
              isDark ? "text-zinc-600" : "text-zinc-900",
              isAnimating && !isDark && "rotate-90 scale-110"
            )}
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Sliding circle with active icon */}
      <div
        className={cn(
          "absolute flex justify-center items-center w-8 h-8 rounded-full transition-all duration-300 ease-in-out shadow-sm",
          isDark
            ? "left-1 bg-zinc-800"
            : "left-[calc(100%-2.25rem)] bg-zinc-300",
          isAnimating && "scale-110"
        )}
      >
        {isDark ? (
          <Moon
            className={cn(
              "w-4 h-4 text-white transition-all duration-300",
              isAnimating && "rotate-12"
            )}
            strokeWidth={1.5}
          />
        ) : (
          <Sun
            className={cn(
              "w-4 h-4 text-zinc-900 transition-all duration-300",
              isAnimating && "rotate-90"
            )}
            strokeWidth={1.5}
          />
        )}
      </div>
    </div>
  )
}

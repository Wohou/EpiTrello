'use client'

import { useEffect } from 'react'
import './cursor-glow.css'

export default function CursorGlow() {
  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      const glow = document.querySelector('.cursor-glow') as HTMLElement
      if (glow) {
        glow.style.left = `${e.clientX}px`
        glow.style.top = `${e.clientY}px`
      }
    }

    document.addEventListener('mousemove', updateCursor)

    return () => {
      document.removeEventListener('mousemove', updateCursor)
    }
  }, [])

  return <div className="cursor-glow" />
}

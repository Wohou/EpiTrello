import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import CursorGlow from '../components/CursorGlow'

describe('CursorGlow', () => {
  it('should render the cursor-glow div', () => {
    const { container } = render(<CursorGlow />)
    const glowElement = container.querySelector('.cursor-glow')
    expect(glowElement).toBeInTheDocument()
  })

  it('should update position on mousemove', () => {
    const { container } = render(<CursorGlow />)
    const glowElement = container.querySelector('.cursor-glow') as HTMLElement

    fireEvent.mouseMove(document, { clientX: 100, clientY: 200 })

    expect(glowElement.style.left).toBe('100px')
    expect(glowElement.style.top).toBe('200px')
  })

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
    const { unmount } = render(<CursorGlow />)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })
})

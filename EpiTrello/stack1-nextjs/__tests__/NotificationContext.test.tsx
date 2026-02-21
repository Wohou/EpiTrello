/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NotificationProvider, useNotification } from '../components/NotificationContext'

// Test component that uses the notification context
function TestConsumer() {
  const { confirm, alert, toast } = useNotification()

  return (
    <div>
      <button onClick={() => confirm({ message: 'Confirm this?' }).then(r => {
        (window as any).__confirmResult = r
      })}>
        Open Confirm
      </button>
      <button onClick={() => confirm({ title: 'Danger', message: 'Delete?', confirmText: 'Yes', cancelText: 'No', variant: 'danger' }).then(r => {
        (window as any).__confirmResult = r
      })}>
        Open Danger Confirm
      </button>
      <button onClick={() => alert({ message: 'Alert message' }).then(() => {
        (window as any).__alertDone = true
      })}>
        Open Alert
      </button>
      <button onClick={() => alert({ title: 'Error', message: 'Error occurred', okText: 'Got it', variant: 'error' }).then(() => {
        (window as any).__alertDone = true
      })}>
        Open Error Alert
      </button>
      <button onClick={() => alert({ message: 'Success!', variant: 'success' }).then(() => {
        (window as any).__alertDone = true
      })}>
        Open Success Alert
      </button>
      <button onClick={() => toast({ message: 'Toast!', variant: 'success', duration: 100 })}>
        Show Toast
      </button>
      <button onClick={() => toast({ message: 'Warning', variant: 'warning' })}>
        Show Warning Toast
      </button>
      <button onClick={() => toast({ message: 'Error', variant: 'error' })}>
        Show Error Toast
      </button>
      <button onClick={() => toast({ message: 'Info' })}>
        Show Info Toast
      </button>
    </div>
  )
}

describe('NotificationContext', () => {
  beforeEach(() => {
    delete (window as any).__confirmResult
    delete (window as any).__alertDone
  })

  it('should throw error when useNotification is used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useNotification must be used within a NotificationProvider')
    spy.mockRestore()
  })

  it('should render children', () => {
    render(
      <NotificationProvider>
        <div>Child Content</div>
      </NotificationProvider>
    )
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  it('should show confirm modal and resolve true on confirm', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Open Confirm'))
    expect(screen.getByText('Confirm this?')).toBeInTheDocument()
    expect(screen.getByText('Confirmer')).toBeInTheDocument()
    expect(screen.getByText('Annuler')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByText('Confirmer'))
    })
    expect((window as any).__confirmResult).toBe(true)
  })

  it('should show confirm modal and resolve false on cancel', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Open Confirm'))

    await act(async () => {
      fireEvent.click(screen.getByText('Annuler'))
    })
    expect((window as any).__confirmResult).toBe(false)
  })

  it('should show danger confirm modal with custom text', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Open Danger Confirm'))
    expect(screen.getByText('Danger')).toBeInTheDocument()
    expect(screen.getByText('Delete?')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('should close confirm modal on overlay click', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Open Confirm'))
    const overlay = document.querySelector('.notification-overlay')

    await act(async () => {
      fireEvent.click(overlay!)
    })
    expect((window as any).__confirmResult).toBe(false)
  })

  it('should show alert modal and close on OK', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Open Alert'))
    expect(screen.getByText('Alert message')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByText('OK'))
    })

    expect((window as any).__alertDone).toBe(true)
  })

  it('should show error alert with custom OK text', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Open Error Alert'))
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
    expect(screen.getByText('Got it')).toBeInTheDocument()
  })

  it('should show success alert', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Open Success Alert'))
    expect(screen.getByText('Success!')).toBeInTheDocument()
  })

  it('should close alert on overlay click', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Open Alert'))
    const overlay = document.querySelector('.notification-overlay')

    await act(async () => {
      fireEvent.click(overlay!)
    })
    expect((window as any).__alertDone).toBe(true)
  })

  it('should show toast notification', async () => {
    jest.useFakeTimers()
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Show Toast'))
    expect(screen.getByText('Toast!')).toBeInTheDocument()

    // After duration, toast should start exit animation
    act(() => {
      jest.advanceTimersByTime(150)
    })

    // After exit animation
    act(() => {
      jest.advanceTimersByTime(250)
    })

    expect(screen.queryByText('Toast!')).not.toBeInTheDocument()
    jest.useRealTimers()
  })

  it('should show warning toast', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Show Warning Toast'))
    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('should show error toast', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Show Error Toast'))
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('should show info toast (default variant)', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Show Info Toast'))
    expect(screen.getByText('Info')).toBeInTheDocument()
  })

  it('should handle Escape key for confirm', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Open Confirm'))

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })

    expect((window as any).__confirmResult).toBe(false)
  })

  it('should handle Escape key for alert', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Open Alert'))

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })

    expect((window as any).__alertDone).toBe(true)
  })

  it('should handle Enter key for alert', async () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Open Alert'))

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Enter' })
    })

    expect((window as any).__alertDone).toBe(true)
  })

  it('should stop propagation when clicking modal content', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    )

    fireEvent.click(screen.getByText('Open Confirm'))
    const modal = document.querySelector('.notification-modal')

    // Click on the modal content itself shouldn't close it
    fireEvent.click(modal!)
    expect(screen.getByText('Confirm this?')).toBeInTheDocument()
  })
})

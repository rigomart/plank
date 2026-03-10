import { FitAddon } from '@xterm/addon-fit'
import { Terminal as XTerm } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'
import { trpc } from '../trpc'

interface TerminalProps {
  command: string
  args: string[]
  cwd?: string
  initialInput?: string
  onExit?: (exitCode: number) => void
}

export function Terminal({
  command,
  args,
  cwd,
  initialInput,
  onExit
}: TerminalProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm | null>(null)

  // Stable refs for callbacks to avoid re-running the effect
  const onExitRef = useRef(onExit)
  onExitRef.current = onExit
  const initialInputRef = useRef(initialInput)
  initialInputRef.current = initialInput

  useEffect(() => {
    if (!containerRef.current) return

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0d0d14',
        foreground: '#c8c8d0',
        cursor: '#4a4fc4'
      }
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()
    termRef.current = term

    let sessionId: string | null = null
    let initialInputSent = false

    term.onData((data) => {
      if (sessionId) {
        trpc.terminal.write.mutate({ id: sessionId, data })
      }
    })

    const sub = trpc.terminal.spawn.subscribe(
      { command, args, cwd },
      {
        onData(event) {
          if (event.type === 'started') {
            sessionId = event.id
            const { cols, rows } = term
            trpc.terminal.resize.mutate({ id: event.id, cols, rows })
          } else if (event.type === 'data') {
            term.write(event.data)
            // Send initial input once we see output (CLI has started)
            if (!initialInputSent && initialInputRef.current && sessionId) {
              initialInputSent = true
              // Small delay to let the CLI fully initialize
              setTimeout(() => {
                if (sessionId) {
                  trpc.terminal.write.mutate({
                    id: sessionId,
                    data: `${initialInputRef.current}\n`
                  })
                }
              }, 500)
            }
          } else if (event.type === 'exit') {
            onExitRef.current?.(event.exitCode)
          }
        },
        onError(err) {
          term.write(`\r\n\x1b[31mError: ${err.message}\x1b[0m\r\n`)
        },
        onComplete() {}
      }
    )

    const handleResize = (): void => {
      fitAddon.fit()
      if (sessionId) {
        const { cols, rows } = term
        trpc.terminal.resize.mutate({ id: sessionId, cols, rows })
      }
    }

    const observer = new ResizeObserver(handleResize)
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      sub.unsubscribe()
      term.dispose()
    }
  }, [command, args, cwd])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}

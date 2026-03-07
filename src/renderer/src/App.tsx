import { useEffect, useRef, useState } from 'react'
import { trpc } from './trpc'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

let nextId = 0

function App(): React.JSX.Element {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  })

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault()
    const prompt = input.trim()
    if (!prompt || loading) return

    setMessages((prev) => [...prev, { id: ++nextId, role: 'user', content: prompt }])
    setInput('')
    setLoading(true)

    trpc.agent.chat.subscribe(
      { prompt },
      {
        onData(data) {
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, content: data.text }]
            }
            return [...prev, { id: ++nextId, role: 'assistant', content: data.text }]
          })
        },
        onError(err) {
          setMessages((prev) => [
            ...prev,
            { id: ++nextId, role: 'assistant', content: `Error: ${err.message}` }
          ])
          setLoading(false)
        },
        onComplete() {
          setLoading(false)
        }
      }
    )
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">Ask Claude anything to get started.</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
            <div className="chat-message__label">{msg.role === 'user' ? 'You' : 'Claude'}</div>
            <div className="chat-message__content">{msg.content}</div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role === 'user' && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message__label">Claude</div>
            <div className="chat-message__content chat-message__thinking">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button className="chat-send" type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}

export default App

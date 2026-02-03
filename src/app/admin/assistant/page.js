'use client'

import { useState, useRef, useEffect } from 'react'
import { SparklesIcon } from '@/components/admin/Icons'

// AI/Robot icon for the assistant
const RobotIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
)

const exampleQueries = [
  "Hur många användare registrerade sig förra veckan?",
  "Vilka användare har nått sin månadsgräns?",
  "Visa top 10 mest använda recept",
  "Hur många premium-användare har vi?",
  "Vilka produkter har störst prisdiffer mellan butiker?",
  "Lista användare som inte loggat in på 30 dagar",
]

export default function AssistantPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(query = input) {
    if (!query.trim()) return

    const userMessage = { role: 'user', content: query }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await res.json()

      const assistantMessage = {
        role: 'assistant',
        content: data.response || 'Kunde inte besvara frågan.',
        sql: data.sql,
        results: data.results,
        count: data.count
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to get response:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ett fel uppstod. Försök igen.',
        error: true
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-purple-500 rounded-lg">
            <RobotIcon className="w-6 h-6 text-white" />
          </div>
          Admin AI Assistant
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Ställ frågor om din data på vanlig svenska
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
              <RobotIcon className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Hej! Jag är din admin-assistent
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Ställ frågor om användare, produkter, statistik och mer
            </p>

            <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
              {exampleQueries.map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(query)}
                  className="text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  "{query}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.error
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* SQL Query */}
                {msg.sql && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Genererad SQL:</p>
                    <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
                      {msg.sql}
                    </pre>
                  </div>
                )}

                {/* Results Table */}
                {msg.results && msg.results.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Resultat ({msg.count} rader):
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-200 dark:bg-gray-600">
                          <tr>
                            {Object.keys(msg.results[0]).map(key => (
                              <th key={key} className="px-2 py-1 text-left font-semibold">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.results.slice(0, 10).map((row, j) => (
                            <tr key={j} className="border-t border-gray-200 dark:border-gray-600">
                              {Object.values(row).map((val, k) => (
                                <td key={k} className="px-2 py-1 truncate max-w-[150px]">
                                  {val === null ? '-' : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {msg.count > 10 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Visar 10 av {msg.count} resultat
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ställ en fråga om din data..."
            rows={1}
            className="flex-1 px-4 py-3 bg-transparent text-gray-900 dark:text-white resize-none focus:outline-none"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tips */}
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
        AI kan göra misstag. Verifiera viktiga uppgifter.
      </p>
    </div>
  )
}

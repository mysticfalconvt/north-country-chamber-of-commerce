'use client'

import { useState } from 'react'
import './index.scss'

const baseClass = 'translation-button'

export const TranslationButton: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState<string[]>([])
  const [showProgress, setShowProgress] = useState(false)
  const [forceMode, setForceMode] = useState(false)

  const handleBackfill = async () => {
    setIsRunning(true)
    setStatus('idle')
    setMessage('')
    setProgress([])
    setShowProgress(true)

    try {
      setProgress((prev) => [...prev, '🚀 Starting translation backfill...'])

      const url = forceMode ? '/api/backfill-translations?force=true' : '/api/backfill-translations'

      const response = await fetch(url, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter((line) => line.trim())

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'progress') {
                  setProgress((prev) => [...prev, data.message])
                } else if (data.type === 'complete') {
                  setStatus('success')
                  setMessage(data.message)
                } else if (data.type === 'error') {
                  setStatus('error')
                  setMessage(data.message)
                }
              } catch (e) {
                console.error('Error parsing SSE:', e)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Backfill error:', error)
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsRunning(false)
    }
  }

  

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__controls`}>
      
        <button
          className={`${baseClass}__button`}
          disabled={isRunning}
          onClick={handleBackfill}
          type="button"
        >
          {isRunning ? 'Translating...' : 'Backfill French Translations'}
        </button>
        <label className={`${baseClass}__checkbox`}>
          <input
            type="checkbox"
            checked={forceMode}
            onChange={(e) => setForceMode(e.target.checked)}
            disabled={isRunning}
          />
          <span>Force re-translate (overwrite existing)</span>
        </label>
      </div>

      {status === 'success' && (
        <div className={`${baseClass}__message ${baseClass}__message--success`}>{message}</div>
      )}

      {status === 'error' && (
        <div className={`${baseClass}__message ${baseClass}__message--error`}>{message}</div>
      )}

      {showProgress && progress.length > 0 && (
        <details className={`${baseClass}__progress`} open={isRunning}>
          <summary>Progress Log ({progress.length} messages)</summary>
          <div className={`${baseClass}__progress-log`}>
            {progress.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Languages, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function BackfillTranslationsButton() {
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState<string[]>([])

  const handleBackfill = async () => {
    setIsRunning(true)
    setStatus('idle')
    setMessage('')
    setProgress([])

    try {
      setProgress((prev) => [...prev, '🚀 Starting translation backfill...'])

      const response = await fetch('/api/backfill-translations', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`)
      }

      // Stream the response
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
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Languages className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Backfill French Translations</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Automatically translate all existing English content to French. This will only translate
              content that doesn&apos;t already have French translations.
            </p>
          </div>
        </div>

        <Button
          onClick={handleBackfill}
          disabled={isRunning}
          className="w-full sm:w-auto"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Languages className="mr-2 h-4 w-4" />
              Run Translation Backfill
            </>
          )}
        </Button>

        {/* Status Message */}
        {status === 'success' && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950 p-4 text-green-900 dark:text-green-100">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950 p-4 text-red-900 dark:text-red-100">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {/* Progress Log */}
        {progress.length > 0 && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="text-sm font-medium mb-2">Progress:</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
              {progress.map((line, i) => (
                <div key={i} className="text-muted-foreground">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

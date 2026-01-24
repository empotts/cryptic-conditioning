import { useState, useEffect, useRef } from 'react'
import type { Clue } from '~/utils/clues'

interface CrypticTrainerProps {
  clue: Clue
  onNewClue?: () => void
  showCopyLink?: boolean
  showNewClue?: boolean
  endlessLink?: boolean
}

export function CrypticTrainer({ 
  clue, 
  onNewClue, 
  showCopyLink = false, 
  showNewClue = true,
  endlessLink = false 
}: CrypticTrainerProps) {
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [copySuccess, setCopySuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset state when clue changes
  useEffect(() => {
    setUserAnswer('')
    setFeedback(null)
    setRevealed(false)
    setSeconds(0)
    inputRef.current?.focus()
  }, [clue.clue, clue.answer])

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [clue.clue, clue.answer])

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const normalizeAnswer = (answer: string) => {
    return answer.toUpperCase().replace(/[^A-Z]/g, '')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    const normalized = normalizeAnswer(value)
    const answerLength = normalizeAnswer(clue.answer).length
    
    if (normalized.length <= answerLength) {
      setUserAnswer(normalized)
    }
  }

  const handleCheck = () => {
    const normalized = normalizeAnswer(userAnswer)
    const correctNormalized = normalizeAnswer(clue.answer)
    
    if (normalized === correctNormalized) {
      setFeedback('correct')
    } else {
      setFeedback('incorrect')
    }
  }

  const handleReveal = () => {
    setRevealed(true)
    setFeedback(null)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div className="text-right text-gray-500 font-mono text-xl">
        {formatTime(seconds)}
      </div>

      <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded border border-gray-300 dark:border-gray-700">
        <p className="font-mono text-lg leading-relaxed">{clue.clue}</p>
      </div>

      <div className="space-y-4">
        {/* Character boxes */}
        <div className="flex gap-1 justify-center flex-wrap">
          {Array.from({ length: normalizeAnswer(clue.answer).length }).map((_, i) => {
            const char = userAnswer[i] || ''
            return (
              <div
                key={`char-${i}-${clue.answer}`}
                className="w-10 h-12 border-2 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-950 rounded flex items-center justify-center font-mono text-2xl font-bold"
              >
                {char}
              </div>
            )
          })}
        </div>

        {/* Hidden input for keyboard capture */}
        <input
          ref={inputRef}
          type="text"
          value={userAnswer}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !revealed) {
              handleCheck()
            }
          }}
          disabled={revealed}
          placeholder="Type your answer..."
          className="w-full p-3 font-mono text-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 text-center"
          maxLength={normalizeAnswer(clue.answer).length}
        />

        {feedback === 'correct' && (
          <div className="text-green-600 dark:text-green-400 font-mono">
            ✓ Correct!
          </div>
        )}

        {feedback === 'incorrect' && (
          <div className="text-red-600 dark:text-red-400 font-mono">
            ✗ Try again
          </div>
        )}

        {revealed && (
          <div className="text-blue-600 dark:text-blue-400 font-mono text-xl font-bold">
            Answer: {clue.answer}
          </div>
        )}

        <div className="flex gap-2 flex-wrap justify-center">
          {!revealed && (
            <>
              <button
                type="button"
                onClick={handleCheck}
                className="px-4 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 font-mono rounded hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
              >
                Check
              </button>
              <button
                type="button"
                onClick={handleReveal}
                className="px-4 py-2 bg-gray-600 dark:bg-gray-400 text-white dark:text-gray-900 font-mono rounded hover:bg-gray-500 dark:hover:bg-gray-300 transition-colors"
              >
                Reveal
              </button>
            </>
          )}

          {showNewClue && onNewClue && (
            <button
              type="button"
              onClick={onNewClue}
              className="px-4 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 font-mono rounded hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
            >
              New Clue
            </button>
          )}

          {endlessLink && (
            <a
              href="/endless"
              className="px-4 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 font-mono rounded hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors inline-block"
            >
              Try Endless Mode
            </a>
          )}

          {showCopyLink && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 bg-gray-600 dark:bg-gray-400 text-white dark:text-gray-900 font-mono rounded hover:bg-gray-500 dark:hover:bg-gray-300 transition-colors"
            >
              {copySuccess ? '✓ Copied!' : 'Copy Link'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

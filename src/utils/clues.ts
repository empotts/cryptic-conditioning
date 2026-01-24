import { createServerFn } from '@tanstack/react-start'
import cluesData from './clues_simple.json'

export interface Clue {
  clue: string
  answer: string
}

const clues: Clue[] = cluesData

export const getClueByIndex = createServerFn({ method: 'GET' })
  .inputValidator((index: number) => index)
  .handler(({ data: index }) => {
    const normalizedIndex = ((index % clues.length) + clues.length) % clues.length
    return clues[normalizedIndex]
  })

export function getClueCount(): number {
  return clues.length
}

export function hashSeedToIndex(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function getDateBasedIndex(): number {
  const now = new Date()
  const start = new Date('2024-01-01')
  const daysSinceStart = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  )
  return daysSinceStart % clues.length
}

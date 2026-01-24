import { createFileRoute } from '@tanstack/react-router'
import { getClueByIndex, getDateBasedIndex } from '~/utils/clues'
import { CrypticTrainer } from '~/components/CrypticTrainer'

export const Route = createFileRoute('/daily')({
  loader: async () => {
    const index = getDateBasedIndex()
    const clue = await getClueByIndex({ data: index })
    return { clue, index }
  },
  component: DailyClue,
})

function DailyClue() {
  const { clue } = Route.useLoaderData()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 border-b border-gray-300 dark:border-gray-700">
        <h1 className="font-mono text-2xl text-center">
          <a href="/" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
            Cryptic Conditioner
          </a>
        </h1>
      </header>
      <main className="flex-1">
        <CrypticTrainer 
          clue={clue} 
          showCopyLink={true}
          showNewClue={false}
          endlessLink={true}
        />
      </main>
    </div>
  )
}

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-8">
			<h1 className="font-mono text-4xl mb-12 text-center">
				Cryptic Conditioning
			</h1>
			<div className="space-y-4 w-full max-w-md">
				<Link
					to="/daily"
					className="block w-full p-6 text-center font-mono text-xl bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
				>
					Daily Cryptic
				</Link>
				<Link
					to="/endless"
					className="block w-full p-6 text-center font-mono text-xl bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
				>
					Endless Mode
				</Link>
				<Link
					to="/mini"
					className="block w-full p-6 text-center font-mono text-xl bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
				>
					Mini Crossword
				</Link>
			</div>
			<p className="mt-12 text-gray-500 font-mono text-sm text-center max-w-md">
				Train your cryptic crossword skills. Daily gives you one puzzle per day.
				Endless mode lets you practice with shareable links. Mini gives you a
				7x7 four-clue crossword.
			</p>
		</div>
	);
}

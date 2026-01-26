import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { CrypticTrainer } from "~/components/CrypticTrainer";
import { getClueByIndex, hashSeedToIndex } from "~/utils/clues";

interface EndlessSearch {
	seed?: string;
}

export const Route = createFileRoute("/endless")({
	validateSearch: (search: Record<string, unknown>): EndlessSearch => {
		return {
			seed: typeof search.seed === "string" ? search.seed : undefined,
		};
	},
	loaderDeps: ({ search }) => ({ seed: search.seed }),
	beforeLoad: ({ search }) => {
		if (!search.seed) {
			const newSeed = Math.random().toString(36).substring(2, 15);
			throw redirect({ to: "/endless", search: { seed: newSeed } });
		}
	},
	loader: async ({ deps }) => {
		const seed = deps.seed!;
		const index = hashSeedToIndex(seed);
		const clue = await getClueByIndex({ data: index });
		return { clue, seed };
	},
	component: EndlessClue,
});

function EndlessClue() {
	const { clue, seed } = Route.useLoaderData();
	const navigate = useNavigate();

	const handleNewClue = () => {
		const newSeed = Math.random().toString(36).substring(2, 15);
		navigate({ to: "/endless", search: { seed: newSeed } });
	};

	return (
		<div className="min-h-screen flex flex-col overflow-hidden">
			<header className="p-4 border-b border-gray-300 dark:border-gray-700 flex-shrink-0">
				<h1 className="font-mono text-xl md:text-2xl text-center">
					<a
						href="/"
						className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
					>
						Cryptic Conditioning
					</a>
				</h1>
			</header>
			<main className="flex-1 overflow-y-auto">
				<CrypticTrainer
					clue={clue}
					onNewClue={handleNewClue}
					showCopyLink={true}
					showNewClue={true}
				/>
			</main>
		</div>
	);
}

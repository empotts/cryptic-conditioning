import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { MiniCrossword } from "~/components/MiniCrossword";
import { generateMiniPuzzle } from "~/utils/clues";

interface MiniSearch {
	seed?: string;
}

export const Route = createFileRoute("/mini")({
	validateSearch: (search: Record<string, unknown>): MiniSearch => {
		return {
			seed: typeof search.seed === "string" ? search.seed : undefined,
		};
	},
	loaderDeps: ({ search }) => ({ seed: search.seed }),
	beforeLoad: ({ search }) => {
		if (!search.seed) {
			const newSeed = Math.random().toString(36).substring(2, 15);
			throw redirect({ to: "/mini", search: { seed: newSeed } });
		}
	},
	loader: async ({ deps }) => {
		const seed = deps.seed!;
		const puzzle = await generateMiniPuzzle({ data: seed });
		return { puzzle, seed };
	},
	component: MiniRoute,
});

function MiniRoute() {
	const { puzzle } = Route.useLoaderData();
	const navigate = useNavigate();

	const handleGenerate = () => {
		const newSeed = Math.random().toString(36).substring(2, 15);
		navigate({ to: "/mini", search: { seed: newSeed } });
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
				<MiniCrossword puzzle={puzzle} onGenerate={handleGenerate} />
			</main>
		</div>
	);
}

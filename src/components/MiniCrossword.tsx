import { useEffect, useMemo, useRef, useState } from "react";
import type { MiniEntry, MiniPuzzle } from "~/utils/clues";

interface MiniCrosswordProps {
	puzzle: MiniPuzzle;
	onGenerate: () => void;
}

export function MiniCrossword({ puzzle, onGenerate }: MiniCrosswordProps) {
	const [grid, setGrid] = useState<string[]>(puzzle.grid);
	const [activeEntryId, setActiveEntryId] = useState<MiniEntry["id"] | null>(
		puzzle.entries[0]?.id ?? null,
	);
	const [activeCell, setActiveCell] = useState<number | null>(null);
	const [inputValue, setInputValue] = useState("");
	const [checkStatus, setCheckStatus] = useState<
		"correct" | "incorrect" | null
	>(null);
	const [revealed, setRevealed] = useState(false);
	const [copyStatus, setCopyStatus] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const entryCells = useMemo(() => {
		const map: Record<MiniEntry["id"], number[]> = {
			A1: [],
			A2: [],
			D1: [],
			D2: [],
		};

		puzzle.entries.forEach((entry) => {
			const cells: number[] = [];
			for (let i = 0; i < entry.length; i++) {
				const row = entry.row + (entry.direction === "down" ? i : 0);
				const col = entry.col + (entry.direction === "across" ? i : 0);
				cells.push(row * puzzle.size + col);
			}
			map[entry.id] = cells;
		});

		return map;
	}, [puzzle.entries, puzzle.size]);

	const entriesById = useMemo(() => {
		return puzzle.entries.reduce(
			(acc, entry) => {
				acc[entry.id] = entry;
				return acc;
			},
			{} as Partial<Record<MiniEntry["id"], MiniEntry>>,
		);
	}, [puzzle.entries]);

	const orderedEntryIds = useMemo(() => {
		return ["A1", "A2", "D1", "D2"].filter((id) =>
			puzzle.entries.some((entry) => entry.id === id),
		) as MiniEntry["id"][];
	}, [puzzle.entries]);

	useEffect(() => {
		setGrid(puzzle.grid);
		setActiveEntryId(puzzle.entries[0]?.id ?? null);
		setActiveCell(
			puzzle.entries[0] ? entryCells[puzzle.entries[0].id][0] : null,
		);
		setCheckStatus(null);
		setRevealed(false);
		setTimeout(() => inputRef.current?.focus(), 100);
	}, [puzzle, entryCells]);

	const activeCells = activeEntryId ? entryCells[activeEntryId] : [];

	const getEntriesForCell = (index: number) => {
		return puzzle.entries.filter((entry) =>
			entryCells[entry.id].includes(index),
		);
	};

	const getAlternateEntry = (
		index: number,
		currentEntryId: MiniEntry["id"],
	) => {
		const entriesContaining = getEntriesForCell(index);
		return entriesContaining.find((entry) => entry.id !== currentEntryId);
	};

	const handleCellClick = (index: number) => {
		if (puzzle.solution[index] === ".") {
			return;
		}

		const entriesContaining = getEntriesForCell(index);

		if (entriesContaining.length === 0) {
			return;
		}

		const preferredEntry =
			entriesContaining.find((entry) => entry.id === activeEntryId) ??
			entriesContaining[0];

		setActiveEntryId(preferredEntry.id);
		setActiveCell(index);
		inputRef.current?.focus();
	};

	const handleClueClick = (entryId: MiniEntry["id"]) => {
		setActiveEntryId(entryId);
		const firstCell = entryCells[entryId]?.[0] ?? null;
		setActiveCell(firstCell);
		inputRef.current?.focus();
	};

	const focusEntry = (entryId: MiniEntry["id"]) => {
		setActiveEntryId(entryId);
		const firstCell = entryCells[entryId]?.[0] ?? null;
		setActiveCell(firstCell);
		inputRef.current?.focus();
	};

	const moveToNextEntry = (direction: "next" | "prev") => {
		if (orderedEntryIds.length === 0) return;
		const currentIndex = activeEntryId
			? orderedEntryIds.indexOf(activeEntryId)
			: -1;
		const startIndex = currentIndex === -1 ? 0 : currentIndex;
		const offset = direction === "next" ? 1 : -1;
		const nextIndex =
			(startIndex + offset + orderedEntryIds.length) % orderedEntryIds.length;
		const entryId = orderedEntryIds[nextIndex];
		if (entryId) {
			focusEntry(entryId);
		}
	};

	const moveWithinEntry = (direction: "next" | "prev") => {
		if (!activeEntryId || activeCell === null) return;
		const cells = entryCells[activeEntryId];
		const currentIndex = cells.indexOf(activeCell);
		if (currentIndex === -1) return;

		const nextIndex =
			direction === "next" ? currentIndex + 1 : currentIndex - 1;
		if (cells[nextIndex] !== undefined) {
			setActiveCell(cells[nextIndex]);
		}
	};

	const updateCell = (index: number, value: string) => {
		setGrid((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value.toUpperCase().replace(/[^A-Z]/g, "");
		if (!value || activeCell === null || revealed) {
			setInputValue("");
			return;
		}

		updateCell(activeCell, value[value.length - 1]);
		setInputValue("");
		moveWithinEntry("next");
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (revealed) return;

		if (event.key === "Tab") {
			event.preventDefault();
			moveToNextEntry(event.shiftKey ? "prev" : "next");
			return;
		}

		if (event.key === " " || event.code === "Space") {
			event.preventDefault();
			if (activeCell !== null && activeEntryId) {
				const alternate = getAlternateEntry(activeCell, activeEntryId);
				if (alternate) {
					setActiveEntryId(alternate.id);
				}
			}
			return;
		}

		if (event.key === "Backspace" && activeCell !== null) {
			event.preventDefault();
			if (grid[activeCell]) {
				updateCell(activeCell, "");
			} else {
				moveWithinEntry("prev");
				const cells = activeEntryId ? entryCells[activeEntryId] : [];
				const previousCell = cells[cells.indexOf(activeCell) - 1];
				if (previousCell !== undefined) {
					updateCell(previousCell, "");
				}
			}
		}

		if (!activeEntryId || activeCell === null) return;
		const cells = entryCells[activeEntryId];
		const currentIndex = cells.indexOf(activeCell);
		if (currentIndex === -1) return;

		const currentEntry = entriesById[activeEntryId];
		if (!currentEntry) return;

		const moveWithinEntryBy = (delta: number) => {
			const nextIndex = Math.min(
				cells.length - 1,
				Math.max(0, currentIndex + delta),
			);
			setActiveCell(cells[nextIndex]);
		};

		const switchOrientationIfPossible = () => {
			const alternate = getAlternateEntry(activeCell, activeEntryId);
			if (alternate) {
				setActiveEntryId(alternate.id);
			}
		};

		if (event.key === "ArrowLeft") {
			event.preventDefault();
			if (currentEntry.direction === "across") {
				moveWithinEntryBy(-1);
			} else {
				switchOrientationIfPossible();
			}
		}

		if (event.key === "ArrowRight") {
			event.preventDefault();
			if (currentEntry.direction === "across") {
				moveWithinEntryBy(1);
			} else {
				switchOrientationIfPossible();
			}
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			if (currentEntry.direction === "down") {
				moveWithinEntryBy(-1);
			} else {
				switchOrientationIfPossible();
			}
		}

		if (event.key === "ArrowDown") {
			event.preventDefault();
			if (currentEntry.direction === "down") {
				moveWithinEntryBy(1);
			} else {
				switchOrientationIfPossible();
			}
		}
	};

	const handleCheck = () => {
		const allCorrect = puzzle.solution.every((cell, index) => {
			if (cell === ".") return true;
			return grid[index] === cell;
		});
		setCheckStatus(allCorrect ? "correct" : "incorrect");
	};

	const handleReveal = () => {
		setGrid(puzzle.solution.map((cell) => (cell === "." ? "." : cell)));
		setRevealed(true);
		setCheckStatus(null);
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopyStatus(true);
			setTimeout(() => setCopyStatus(false), 2000);
		} catch (error) {
			console.error("Failed to copy link:", error);
		}
	};

	const renderGridCell = (cell: string, index: number) => {
		const isBlock = cell === ".";
		const isActive = activeCell === index;
		const isInActiveEntry = activeCells.includes(index);

		const baseClasses =
			"w-full aspect-square border border-gray-400 dark:border-gray-600 flex items-center justify-center font-mono text-base text-3xl font-bold min-h-[48px]";
		const blockClasses = "bg-gray-300 dark:bg-gray-800";
		const entryClasses = isInActiveEntry
			? "bg-yellow-100 dark:bg-yellow-900/30"
			: "";
		const activeClasses = isActive
			? "ring-2 ring-gray-700 dark:ring-gray-300"
			: "";

		return (
			<button
				key={`cell-${index}-${puzzle.seed}`}
				type="button"
				onClick={() => handleCellClick(index)}
				className={`${baseClasses} ${isBlock ? blockClasses : ""} ${entryClasses} ${activeClasses}`}
				disabled={isBlock}
			>
				{!isBlock && grid[index]}
			</button>
		);
	};

	return (
		<div className="max-w-4xl mx-auto p-4 space-y-6">
			<div className="text-xs text-gray-500 font-mono text-center">
				Arrow keys move or switch orientation • Space flips direction • Tab
				jumps clues
			</div>
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<button
					type="button"
					onClick={onGenerate}
					className="px-4 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 font-mono rounded hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
				>
					Generate Mini (4 clues)
				</button>
				<div className="flex gap-2 flex-wrap">
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
					<button
						type="button"
						onClick={handleCopyLink}
						className="px-4 py-2 bg-gray-600 dark:bg-gray-400 text-white dark:text-gray-900 font-mono rounded hover:bg-gray-500 dark:hover:bg-gray-300 transition-colors"
					>
						{copyStatus ? "✓ Copied!" : "Copy Link"}
					</button>
				</div>
			</div>

			{checkStatus === "correct" && (
				<div className="text-green-600 dark:text-green-400 font-mono text-center">
					✓ All correct!
				</div>
			)}
			{checkStatus === "incorrect" && (
				<div className="text-red-600 dark:text-red-400 font-mono text-center">
					✗ Not quite yet
				</div>
			)}

			<div className="grid gap-6 md:grid-cols-[auto_1fr]">
				<div className="grid grid-cols-7 gap-1 w-full max-w-[420px] sm:max-w-[520px] md:max-w-[640px] lg:max-w-[760px] xl:max-w-[880px] 2xl:max-w-[960px] mx-auto">
					{grid.map((cell, index) => renderGridCell(cell, index))}
				</div>

				<div className="space-y-4">
					<div>
						<h2 className="font-mono text-lg mb-2">Across</h2>
						<ul className="space-y-2">
							{puzzle.entries
								.filter((entry) => entry.direction === "across")
								.map((entry) => (
									<li key={entry.id}>
										<button
											type="button"
											onClick={() => handleClueClick(entry.id)}
											className={`text-left font-mono w-full ${
												activeEntryId === entry.id
													? "text-gray-900 dark:text-gray-100 font-bold"
													: "text-gray-600 dark:text-gray-400"
											}`}
										>
											{entry.id}: {entry.clue}
										</button>
									</li>
								))}
						</ul>
					</div>
					<div>
						<h2 className="font-mono text-lg mb-2">Down</h2>
						<ul className="space-y-2">
							{puzzle.entries
								.filter((entry) => entry.direction === "down")
								.map((entry) => (
									<li key={entry.id}>
										<button
											type="button"
											onClick={() => handleClueClick(entry.id)}
											className={`text-left font-mono w-full ${
												activeEntryId === entry.id
													? "text-gray-900 dark:text-gray-100 font-bold"
													: "text-gray-600 dark:text-gray-400"
											}`}
										>
											{entry.id}: {entry.clue}
										</button>
									</li>
								))}
						</ul>
					</div>
				</div>
			</div>

			<input
				ref={inputRef}
				value={inputValue}
				onChange={handleInputChange}
				onKeyDown={handleKeyDown}
				className="sr-only"
				disabled={revealed}
				tabIndex={-1}
			/>
		</div>
	);
}

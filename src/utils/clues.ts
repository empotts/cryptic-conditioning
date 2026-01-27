import { createServerFn } from "@tanstack/react-start";
import cluesData from "./clues_simple.json";

export interface Clue {
	clue: string;
	answer: string;
}

export interface MiniEntry {
	id: "A1" | "A2" | "D1" | "D2";
	direction: "across" | "down";
	row: number;
	col: number;
	clue: string;
	answer: string;
	length: number;
}

export interface MiniPuzzle {
	seed: string;
	size: 7;
	grid: string[];
	solution: string[];
	entries: MiniEntry[];
}

const clues: Clue[] = cluesData;

export const getClueByIndex = createServerFn({ method: "GET" })
	.inputValidator((index: number) => index)
	.handler(({ data: index }) => {
		const normalizedIndex =
			((index % clues.length) + clues.length) % clues.length;
		return clues[normalizedIndex];
	});

export const generateMiniPuzzle = createServerFn({ method: "GET" })
	.inputValidator((seed: string) => seed)
	.handler(({ data: seed }) => {
		return createMiniPuzzle(seed);
	});

export function getClueCount(): number {
	return clues.length;
}

export function hashSeedToIndex(seed: string): number {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		const char = seed.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}

export function getDateBasedIndex(): number {
	// Get current time in Central Time (America/Chicago)
	// Central Time is UTC-6 (CST) or UTC-5 (CDT)
	const now = new Date();
	const centralTimeString = now.toLocaleString("en-US", {
		timeZone: "America/Chicago",
	});
	const centralDate = new Date(centralTimeString);
	
	// Reset to midnight Central Time
	const centralMidnight = new Date(
		centralDate.getFullYear(),
		centralDate.getMonth(),
		centralDate.getDate(),
		0,
		0,
		0,
		0,
	);
	
	// Start date at midnight Central Time
	const start = new Date("2024-01-01T00:00:00");
	const startCentralString = start.toLocaleString("en-US", {
		timeZone: "America/Chicago",
	});
	const startCentral = new Date(startCentralString);
	const startCentralMidnight = new Date(
		startCentral.getFullYear(),
		startCentral.getMonth(),
		startCentral.getDate(),
		0,
		0,
		0,
		0,
	);
	
	const daysSinceStart = Math.floor(
		(centralMidnight.getTime() - startCentralMidnight.getTime()) / (1000 * 60 * 60 * 24),
	);
	return daysSinceStart % clues.length;
}

function createMiniPuzzle(seed: string): MiniPuzzle {
	const size = 7;
	const center = 3;
	const rng = createSeededRng(hashSeedToIndex(seed) || 1);
	const maxAttempts = 800;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const grid = Array(size * size).fill("");
		const usedIndices = new Set<number>();

		const acrossPrimary = pickClue(rng, usedIndices);
		if (!acrossPrimary) continue;
		usedIndices.add(acrossPrimary.index);

		const primaryIntersections = pickIntersectingClue(
			rng,
			acrossPrimary,
			usedIndices,
			center,
			size,
		);
		if (!primaryIntersections) continue;

		const {
			downPrimary,
			acrossStartCol,
			downStartRow,
			acrossIndex,
			downIndex,
		} = primaryIntersections;

		placeWord(
			grid,
			acrossPrimary.answer,
			center,
			acrossStartCol,
			"across",
			size,
		);
		placeWord(grid, downPrimary.answer, downStartRow, center, "down", size);

		const acrossSecondary = pickAcrossSecondary(
			rng,
			downPrimary,
			downIndex,
			downStartRow,
			usedIndices,
			center,
			size,
			grid,
		);
		if (!acrossSecondary) continue;

		const downSecondary = pickDownSecondary(
			rng,
			acrossPrimary,
			acrossIndex,
			acrossStartCol,
			usedIndices,
			center,
			size,
			grid,
		);
		if (!downSecondary) continue;

		const entries: MiniEntry[] = [
			{
				id: "A1",
				direction: "across",
				row: center,
				col: acrossStartCol,
				clue: acrossPrimary.clue.clue,
				answer: acrossPrimary.clue.answer,
				length: acrossPrimary.answer.length,
			},
			{
				id: "A2",
				direction: "across",
				row: acrossSecondary.row,
				col: acrossSecondary.col,
				clue: acrossSecondary.clue.clue,
				answer: acrossSecondary.clue.answer,
				length: acrossSecondary.answer.length,
			},
			{
				id: "D1",
				direction: "down",
				row: downStartRow,
				col: center,
				clue: downPrimary.clue.clue,
				answer: downPrimary.clue.answer,
				length: downPrimary.answer.length,
			},
			{
				id: "D2",
				direction: "down",
				row: downSecondary.row,
				col: downSecondary.col,
				clue: downSecondary.clue.clue,
				answer: downSecondary.clue.answer,
				length: downSecondary.answer.length,
			},
		];

		const solution = grid.map((cell) => (cell === "" ? "." : cell));
		const layout = grid.map((cell) => (cell === "" ? "." : ""));

		return {
			seed,
			size: 7,
			grid: layout,
			solution,
			entries,
		};
	}

	return fallbackMiniPuzzle(seed);
}

function normalizeAnswer(answer: string): string {
	return answer.toUpperCase().replace(/[^A-Z]/g, "");
}

function createSeededRng(seed: number): () => number {
	let t = seed;
	return () => {
		t += 0x6d2b79f5;
		let result = Math.imul(t ^ (t >>> 15), t | 1);
		result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
		return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
	};
}

function pickClue(rng: () => number, usedIndices: Set<number>) {
	const minLength = 3;
	const maxLength = 7;
	const maxAttempts = 200;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const index = Math.floor(rng() * clues.length);
		if (usedIndices.has(index)) continue;
		const clue = clues[index];
		const answer = normalizeAnswer(clue.answer);
		if (answer.length < minLength || answer.length > maxLength) continue;
		return { clue, answer, index };
	}

	return null;
}

function findIntersections(across: string, down: string) {
	const intersections: Array<{ acrossIndex: number; downIndex: number }> = [];
	for (let i = 0; i < across.length; i++) {
		for (let j = 0; j < down.length; j++) {
			if (across[i] === down[j]) {
				intersections.push({ acrossIndex: i, downIndex: j });
			}
		}
	}
	return intersections;
}

function pickIntersectingClue(
	rng: () => number,
	acrossPrimary: { clue: Clue; answer: string; index: number },
	usedIndices: Set<number>,
	center: number,
	size: number,
) {
	const maxAttempts = 200;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const candidate = pickClue(rng, usedIndices);
		if (!candidate) return null;

		const intersections = findIntersections(
			acrossPrimary.answer,
			candidate.answer,
		).filter(({ acrossIndex, downIndex }) => {
			const acrossStartCol = center - acrossIndex;
			const downStartRow = center - downIndex;
			return (
				acrossStartCol >= 0 &&
				acrossStartCol + acrossPrimary.answer.length <= size &&
				downStartRow >= 0 &&
				downStartRow + candidate.answer.length <= size
			);
		});

		if (intersections.length === 0) continue;

		const choice = intersections[Math.floor(rng() * intersections.length)];
		usedIndices.add(candidate.index);

		return {
			downPrimary: candidate,
			acrossStartCol: center - choice.acrossIndex,
			downStartRow: center - choice.downIndex,
			acrossIndex: choice.acrossIndex,
			downIndex: choice.downIndex,
		};
	}

	return null;
}

function placeWord(
	grid: string[],
	answer: string,
	row: number,
	col: number,
	direction: "across" | "down",
	size: number,
) {
	for (let i = 0; i < answer.length; i++) {
		const r = row + (direction === "down" ? i : 0);
		const c = col + (direction === "across" ? i : 0);
		const index = r * size + c;
		grid[index] = answer[i];
	}
}

function canPlaceWord(
	grid: string[],
	answer: string,
	row: number,
	col: number,
	direction: "across" | "down",
	size: number,
) {
	const isFilled = (r: number, c: number) => {
		if (r < 0 || c < 0 || r >= size || c >= size) return false;
		return grid[r * size + c] !== "";
	};

	for (let i = 0; i < answer.length; i++) {
		const r = row + (direction === "down" ? i : 0);
		const c = col + (direction === "across" ? i : 0);
		const index = r * size + c;
		const cell = grid[index];
		const isCrossing = cell !== "";

		if (cell !== "" && cell !== answer[i]) {
			return false;
		}

		if ((i === 0 || i === answer.length - 1) && isCrossing) {
			return false;
		}

		if (direction === "across") {
			if (i === 0 && isFilled(r, c - 1)) return false;
			if (i === answer.length - 1 && isFilled(r, c + 1)) return false;
			if (i === 0 || i === answer.length - 1) {
				if (isFilled(r - 1, c) || isFilled(r + 1, c)) return false;
			}
		} else {
			if (i === 0 && isFilled(r - 1, c)) return false;
			if (i === answer.length - 1 && isFilled(r + 1, c)) return false;
			if (i === 0 || i === answer.length - 1) {
				if (isFilled(r, c - 1) || isFilled(r, c + 1)) return false;
			}
		}
	}
	return true;
}

function pickAcrossSecondary(
	rng: () => number,
	downPrimary: { clue: Clue; answer: string; index: number },
	downIndex: number,
	downStartRow: number,
	usedIndices: Set<number>,
	center: number,
	size: number,
	grid: string[],
) {
	const candidateRows = downPrimary.answer
		.split("")
		.map((letter, index) => ({ letter, index }))
		.filter(({ index }) => index !== downIndex);

	for (let attempt = 0; attempt < candidateRows.length * 40; attempt++) {
		const pick = candidateRows[Math.floor(rng() * candidateRows.length)];
		const row = downStartRow + pick.index;
		if (row < 0 || row >= size || Math.abs(row - center) < 2) continue;

		const candidate = pickClueWithLetter(rng, pick.letter, usedIndices);
		if (!candidate) continue;

		const positions = findLetterPositions(candidate.answer, pick.letter);
		for (const position of positions) {
			const startCol = center - position;
			if (startCol < 0 || startCol + candidate.answer.length > size) continue;
			if (!canPlaceWord(grid, candidate.answer, row, startCol, "across", size))
				continue;

			placeWord(grid, candidate.answer, row, startCol, "across", size);
			usedIndices.add(candidate.index);

			return {
				...candidate,
				row,
				col: startCol,
			};
		}
	}

	return null;
}

function pickDownSecondary(
	rng: () => number,
	acrossPrimary: { clue: Clue; answer: string; index: number },
	acrossIndex: number,
	acrossStartCol: number,
	usedIndices: Set<number>,
	center: number,
	size: number,
	grid: string[],
) {
	const candidateCols = acrossPrimary.answer
		.split("")
		.map((letter, index) => ({ letter, index }))
		.filter(({ index }) => index !== acrossIndex);

	for (let attempt = 0; attempt < candidateCols.length * 40; attempt++) {
		const pick = candidateCols[Math.floor(rng() * candidateCols.length)];
		const col = acrossStartCol + pick.index;
		if (col < 0 || col >= size || Math.abs(col - center) < 2) continue;

		const candidate = pickClueWithLetter(rng, pick.letter, usedIndices);
		if (!candidate) continue;

		const positions = findLetterPositions(candidate.answer, pick.letter);
		for (const position of positions) {
			const startRow = center - position;
			if (startRow < 0 || startRow + candidate.answer.length > size) continue;
			if (!canPlaceWord(grid, candidate.answer, startRow, col, "down", size))
				continue;

			placeWord(grid, candidate.answer, startRow, col, "down", size);
			usedIndices.add(candidate.index);

			return {
				...candidate,
				row: startRow,
				col,
			};
		}
	}

	return null;
}

function pickClueWithLetter(
	rng: () => number,
	letter: string,
	usedIndices: Set<number>,
) {
	const minLength = 3;
	const maxLength = 7;
	const maxAttempts = 250;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const index = Math.floor(rng() * clues.length);
		if (usedIndices.has(index)) continue;
		const clue = clues[index];
		const answer = normalizeAnswer(clue.answer);
		if (answer.length < minLength || answer.length > maxLength) continue;
		if (!answer.includes(letter)) continue;
		return { clue, answer, index };
	}

	return null;
}

function findLetterPositions(answer: string, letter: string) {
	const positions: number[] = [];
	for (let i = 0; i < answer.length; i++) {
		if (answer[i] === letter) {
			positions.push(i);
		}
	}
	return positions;
}

function fallbackMiniPuzzle(seed: string): MiniPuzzle {
	const size = 7;
	const grid = Array(size * size).fill(".");
	return {
		seed,
		size: 7,
		grid,
		solution: grid,
		entries: [],
	};
}

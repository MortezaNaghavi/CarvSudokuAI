import type { SudokuGrid, SudokuCell } from "@shared/schema";

export function generateSudokuPuzzle(difficulty: 'easy' | 'medium' | 'hard'): {
  puzzle: number[][];
  solution: number[][];
} {
  const solution = generateCompleteSudoku();
  const puzzle = createPuzzleFromSolution(solution, difficulty);
  return { puzzle, solution };
}

function generateCompleteSudoku(): number[][] {
  const grid: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));
  fillGrid(grid);
  return grid;
}

function fillGrid(grid: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of numbers) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            if (fillGrid(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function isValid(grid: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num || grid[i][col] === num) return false;
  }
  
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[boxRow + i][boxCol + j] === num) return false;
    }
  }
  
  return true;
}

function createPuzzleFromSolution(solution: number[][], difficulty: string): number[][] {
  const puzzle = solution.map(row => [...row]);
  const cellsToRemove = difficulty === 'easy' ? 35 : difficulty === 'medium' ? 45 : 55;
  
  let removed = 0;
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed++;
    }
  }
  
  return puzzle;
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function gridToString(grid: number[][]): string {
  return grid.map(row => row.join('')).join('');
}

export function stringToGrid(str: string): number[][] {
  const grid: number[][] = [];
  for (let i = 0; i < 9; i++) {
    grid.push(str.slice(i * 9, (i + 1) * 9).split('').map(Number));
  }
  return grid;
}

export function createSudokuGrid(puzzle: number[][], solution: number[][]): SudokuGrid {
  const grid: SudokuGrid = [];
  for (let row = 0; row < 9; row++) {
    grid[row] = [];
    for (let col = 0; col < 9; col++) {
      grid[row][col] = {
        value: puzzle[row][col],
        isGiven: puzzle[row][col] !== 0,
        isError: false,
        notes: [],
      };
    }
  }
  return grid;
}

export function validateCell(grid: SudokuGrid, row: number, col: number, solution: number[][]): boolean {
  return grid[row][col].value === solution[row][col];
}

export function checkGridComplete(grid: SudokuGrid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col].value === 0) return false;
    }
  }
  return true;
}

export function getHintsForCell(grid: SudokuGrid, row: number, col: number, solution: number[][]): number[] {
  const hints: number[] = [];
  const correctValue = solution[row][col];
  
  for (let num = 1; num <= 9; num++) {
    if (canPlaceNumber(grid, row, col, num)) {
      hints.push(num);
    }
  }
  
  if (hints.includes(correctValue) && hints.length > 1) {
    return hints;
  }
  
  return hints.length > 0 ? hints : [correctValue];
}

function canPlaceNumber(grid: SudokuGrid, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i].value === num || grid[i][col].value === num) return false;
  }
  
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[boxRow + i][boxCol + j].value === num) return false;
    }
  }
  
  return true;
}

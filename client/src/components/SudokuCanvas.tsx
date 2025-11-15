import { useEffect, useRef, useState } from "react";
import type { SudokuGrid } from "@shared/schema";

interface SudokuCanvasProps {
  grid: SudokuGrid;
  selectedCell: { row: number; col: number } | null;
  onCellSelect: (row: number, col: number) => void;
  showNotes: boolean;
  hideNumbers?: boolean;
  highlightNumber?: number | null;
  hintContext?: {
    row: number;
    col: number;
    mode: "row" | "col" | "box";
    value: number;
  } | null;
}

export function SudokuCanvas({
  grid,
  selectedCell,
  onCellSelect,
  showNotes,
  hideNumbers = false,
  highlightNumber = null,
  hintContext = null,
}: SudokuCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState(0);

  useEffect(() => {
    const updateSize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const size = Math.min(container.clientWidth - 32, container.clientHeight - 32, 600);
        setCanvasSize(size);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
    ctx.scale(dpr, dpr);

    drawGrid(ctx, canvasSize, grid, selectedCell, showNotes, hideNumbers, highlightNumber, hintContext);
  }, [grid, selectedCell, canvasSize, showNotes, hideNumbers, highlightNumber, hintContext]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canvasSize === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellSize = canvasSize / 9;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      onCellSelect(row, col);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (canvasSize === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const cellSize = canvasSize / 9;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      onCellSelect(row, col);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onTouchStart={handleTouchStart}
        className="touch-none cursor-pointer rounded-md shadow-lg"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
        data-testid="canvas-sudoku-board"
        data-selected-cell={selectedCell ? `${selectedCell.row},${selectedCell.col}` : "none"}
        aria-label={selectedCell ? `Cell at row ${selectedCell.row + 1}, column ${selectedCell.col + 1} selected` : "Sudoku board - click to select a cell"}
      />
    </div>
  );
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  size: number,
  grid: SudokuGrid,
  selectedCell: { row: number; col: number } | null,
  showNotes: boolean,
  hideNumbers: boolean,
  highlightNumber: number | null,
  hintContext: { row: number; col: number; mode: "row" | "col" | "box"; value: number } | null
) {
  const getCssColor = (varName: string, fallback: string) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (!raw) return fallback;
    if (raw.startsWith("hsl")) return raw;
    return `hsl(${raw})`;
  };

  const cellSize = size / 9;

  ctx.fillStyle = getCssColor('--card', '#ffffff');
  ctx.fillRect(0, 0, size, size);

  if (selectedCell) {
    ctx.fillStyle = "rgba(168, 85, 247, 0.12)";
    ctx.fillRect(
      selectedCell.col * cellSize,
      selectedCell.row * cellSize,
      cellSize,
      cellSize
    );
  }

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = grid[row][col];
      const cellX = col * cellSize;
      const cellY = row * cellSize;

      // Hint context highlighting (row/column/box + target cell)
      if (hintContext) {
        const inHintRow = hintContext.mode === "row" && row === hintContext.row;
        const inHintCol = hintContext.mode === "col" && col === hintContext.col;
        const inHintBox =
          hintContext.mode === "box" &&
          Math.floor(row / 3) === Math.floor(hintContext.row / 3) &&
          Math.floor(col / 3) === Math.floor(hintContext.col / 3);

        const isTargetCell = row === hintContext.row && col === hintContext.col;

        if (inHintRow || inHintCol || inHintBox) {
          ctx.fillStyle = "rgba(59, 130, 246, 0.18)"; // blue-ish
          ctx.fillRect(cellX, cellY, cellSize, cellSize);
        }

        if (isTargetCell) {
          ctx.fillStyle = "rgba(34, 197, 94, 0.35)"; // green stronger
          ctx.fillRect(cellX, cellY, cellSize, cellSize);
        }
      }

      // Highlight all cells with selected number
      if (highlightNumber != null && cell.value === highlightNumber) {
        ctx.fillStyle = "rgba(168, 85, 247, 0.25)"; // purple
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
      }
      
      if (cell.isError && !hideNumbers) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
      }

      if (cell.value > 0 && !hideNumbers) {
        ctx.fillStyle = cell.isGiven
          ? getCssColor('--foreground', '#0f172a')
          : getCssColor('--carv-purple', '#a855f7');
        ctx.font = `${cell.isGiven ? '600' : '500'} ${cellSize * 0.5}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          cell.value.toString(),
          col * cellSize + cellSize / 2,
          row * cellSize + cellSize / 2
        );
      } else if (showNotes && cell.notes.length > 0 && !hideNumbers) {
        ctx.fillStyle = getCssColor('--muted-foreground', '#6b7280');
        ctx.font = `400 ${cellSize * 0.18}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        cell.notes.forEach((note) => {
          const noteRow = Math.floor((note - 1) / 3);
          const noteCol = (note - 1) % 3;
          const noteX = col * cellSize + (noteCol + 0.5) * (cellSize / 3);
          const noteY = row * cellSize + (noteRow + 0.5) * (cellSize / 3);
          ctx.fillText(note.toString(), noteX, noteY);
        });
      }
    }
  }

  ctx.strokeStyle = getCssColor('--border', '#e5e7eb');
  ctx.lineWidth = 1;
  for (let i = 0; i <= 9; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(size, i * cellSize);
    ctx.stroke();
  }

  ctx.strokeStyle = getCssColor('--foreground', '#1f2937');
  ctx.lineWidth = 3;
  for (let i = 0; i <= 9; i += 3) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(size, i * cellSize);
    ctx.stroke();
  }

  if (selectedCell) {
    ctx.strokeStyle = getCssColor('--carv-purple', '#a855f7');
    ctx.lineWidth = 3;
    ctx.strokeRect(
      selectedCell.col * cellSize + 1.5,
      selectedCell.row * cellSize + 1.5,
      cellSize - 3,
      cellSize - 3
    );
  }
}

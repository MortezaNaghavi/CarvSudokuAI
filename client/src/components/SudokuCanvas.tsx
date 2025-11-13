import { useEffect, useRef, useState } from "react";
import type { SudokuGrid } from "@shared/schema";

interface SudokuCanvasProps {
  grid: SudokuGrid;
  selectedCell: { row: number; col: number } | null;
  onCellSelect: (row: number, col: number) => void;
  showNotes: boolean;
}

export function SudokuCanvas({ grid, selectedCell, onCellSelect, showNotes }: SudokuCanvasProps) {
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

    drawGrid(ctx, canvasSize, grid, selectedCell, showNotes);
  }, [grid, selectedCell, canvasSize, showNotes]);

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
  showNotes: boolean
) {
  const cellSize = size / 9;

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
  const hsl = ctx.fillStyle;
  ctx.fillStyle = hsl.startsWith('hsl') ? hsl : '#ffffff';
  ctx.fillRect(0, 0, size, size);

  if (selectedCell) {
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--carv-purple')
      .trim()
      .replace(/[\d.]+%/g, (match) => {
        const val = parseFloat(match);
        return `${val * 0.15}%`;
      }) || 'rgba(168, 85, 247, 0.15)';
    ctx.fillRect(
      selectedCell.col * cellSize,
      selectedCell.row * cellSize,
      cellSize,
      cellSize
    );

    for (let i = 0; i < 9; i++) {
      ctx.fillRect(i * cellSize, selectedCell.row * cellSize, cellSize, cellSize);
      ctx.fillRect(selectedCell.col * cellSize, i * cellSize, cellSize, cellSize);
    }

    const boxRow = Math.floor(selectedCell.row / 3) * 3;
    const boxCol = Math.floor(selectedCell.col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        ctx.fillRect(
          (boxCol + j) * cellSize,
          (boxRow + i) * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = grid[row][col];
      
      if (cell.isError) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }

      if (cell.value > 0) {
        ctx.fillStyle = cell.isGiven
          ? getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim()
          : getComputedStyle(document.documentElement).getPropertyValue('--carv-purple').trim();
        ctx.font = `${cell.isGiven ? '600' : '500'} ${cellSize * 0.5}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          cell.value.toString(),
          col * cellSize + cellSize / 2,
          row * cellSize + cellSize / 2
        );
      } else if (showNotes && cell.notes.length > 0) {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim();
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

  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#e5e7eb';
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

  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim() || '#1f2937';
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
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--carv-purple').trim() || '#a855f7';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      selectedCell.col * cellSize + 1.5,
      selectedCell.row * cellSize + 1.5,
      cellSize - 3,
      cellSize - 3
    );
  }
}

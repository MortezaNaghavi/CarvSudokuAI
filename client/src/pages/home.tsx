import { useState, useEffect } from "react";
import { SudokuCanvas } from "@/components/SudokuCanvas";
import { NumberPad } from "@/components/NumberPad";
import { GameStats } from "@/components/GameStats";
import { AIHintPanel } from "@/components/AIHintPanel";
import { Leaderboard } from "@/components/Leaderboard";
import { DailyChallenge } from "@/components/DailyChallenge";
import { NFTMintModal } from "@/components/NFTMintModal";
import { ShareToX } from "@/components/ShareToX";
import { WalletConnect } from "@/components/WalletConnect";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SoundToggle } from "@/components/SoundToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, Pause, AlertTriangle, Sparkles } from "lucide-react";
import { generateSudokuPuzzle, createSudokuGrid, checkGridComplete, getHintsForCell, gridToString, stringToGrid } from "@/lib/sudoku";
import { soundManager } from "@/lib/sounds";
import type { SudokuGrid, GameState } from "@shared/schema";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, TransactionInstruction, PublicKey } from "@solana/web3.js";
import { MEMO_PROGRAM_ID } from "@/lib/carv-program";

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [solution, setSolution] = useState<number[][]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [notesMode, setNotesMode] = useState(false);
  const [hint, setHint] = useState<number[] | null>(null);
  const [hintExplanation, setHintExplanation] = useState<string | null>(null);
  const [hintSuggestedNumber, setHintSuggestedNumber] = useState<number | null>(null);
  const [hintContext, setHintContext] = useState<{
    row: number;
    col: number;
    mode: "row" | "col" | "box";
    value: number;
  } | null>(null);
  const [highlightNumber, setHighlightNumber] = useState<number | null>(null);
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [showShareButton, setShowShareButton] = useState(false);
  const [lastSolveTx, setLastSolveTx] = useState<string | null>(null);
  const [activeChallengeDate, setActiveChallengeDate] = useState<string | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean[]>>({});
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [totalWallets, setTotalWallets] = useState<number>(0);
  const [mintedChallenges, setMintedChallenges] = useState<Record<string, boolean[]>>({});
  const [hasMintedCurrentSolve, setHasMintedCurrentSolve] = useState(false);
  const [activeChallengeSlot, setActiveChallengeSlot] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const walletAddress = publicKey ? publicKey.toString() : null;

  const submitLeaderboardMutation = useMutation({
    mutationFn: async (data: { walletAddress: string; time: number; difficulty: string; hintsUsed: number }) => {
      const res = await apiRequest('POST', '/api/leaderboard', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
    },
  });

  const mintNFTMutation = useMutation({
    mutationFn: async (data: { walletAddress: string; puzzleId: string; txSignature: string }) => {
      const res = await apiRequest('POST', '/api/nft/mint', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
      if (walletAddress) {
        queryClient.invalidateQueries({
          queryKey: [`/api/leaderboard?walletAddress=${walletAddress}`],
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/nft/wallet/${walletAddress}`],
        });
      }
    },
  });

  const handleResetDailyProgress = () => {
    setCompletedChallenges({});
    setMintedChallenges({});
    setActiveChallengeDate(null);
    try {
      localStorage.removeItem('sudoku_daily_challenge_completed');
      localStorage.removeItem('sudoku_daily_challenge_minted');
    } catch {
      // ignore
    }
    toast({
      title: "AI Daily Progress Reset",
      description: "All AI Daily Challenge slots have been reset. You can replay them now.",
    });
  };

  useEffect(() => {
    if (!walletAddress) return;

    const recordWallet = async () => {
      try {
        await apiRequest('POST', '/api/wallets/seen', { walletAddress });
        const res = await apiRequest('GET', '/api/stats');
        const data = await res.json();
        setTotalParticipants(data.totalParticipants ?? totalParticipants);
        setTotalWallets(data.totalWallets ?? totalWallets);
      } catch {
        // ignore
      }
    };

    void recordWallet();
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;

    const savedState = localStorage.getItem('sudoku_game_state');
    const savedChallenges = localStorage.getItem('sudoku_daily_challenge_completed');
    const savedMinted = localStorage.getItem('sudoku_daily_challenge_minted');

    if (savedState) {
      const state = JSON.parse(savedState);
      setGameState(state.gameState);
      setSolution(state.solution);
      setIsRunning(false);
      setIsPaused(false);
      setHint(null);
      setHintExplanation(null);
      setHintSuggestedNumber(null);
      setHintContext(null);
      setHighlightNumber(null);
    } else {
      void startNewGame('medium');
    }

    if (savedChallenges) {
      try {
        const parsed = JSON.parse(savedChallenges);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setCompletedChallenges(parsed as Record<string, boolean[]>);
        } else if (Array.isArray(parsed)) {
          const legacy: Record<string, boolean[]> = {};
          (parsed as string[]).forEach((dateKey) => {
            legacy[dateKey] = [true, true, true, true, true, true];
          });
          setCompletedChallenges(legacy);
        }
      } catch {
        // ignore parse errors
      }
    }

    if (savedMinted) {
      try {
        const parsed = JSON.parse(savedMinted);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setMintedChallenges(parsed as Record<string, boolean[]>);
        } else if (Array.isArray(parsed)) {
          const legacy: Record<string, boolean[]> = {};
          (parsed as string[]).forEach((dateKey) => {
            legacy[dateKey] = [true, true, true, true, true, true];
          });
          setMintedChallenges(legacy);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiRequest('GET', '/api/stats');
        const data = await res.json();
        setTotalParticipants(data.totalParticipants ?? 0);
        setTotalWallets(data.totalWallets ?? 0);
      } catch {
        // ignore
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (!gameState || !isRunning) return;

    const timer = setInterval(() => {
      setGameState(prev => prev ? { ...prev, timeElapsed: prev.timeElapsed + 1 } : null);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, gameState]);

  useEffect(() => {
    if (gameState && solution.length > 0) {
      localStorage.setItem('sudoku_game_state', JSON.stringify({ gameState, solution }));
    }
  }, [gameState, solution]);

  const startNewGame = async (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    if (!walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Phantom wallet to start playing CARV Sudoku.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await apiRequest('POST', '/api/puzzles/generate', { difficulty });
      const data = await res.json();
      const puzzle = stringToGrid(data.puzzle);
      const newSolution = stringToGrid(data.solution);
      const grid = createSudokuGrid(puzzle, newSolution);

      const puzzleId = data.id || `puzzle_${Date.now()}_${difficulty}`;
      localStorage.setItem(`puzzle_${puzzleId}`, JSON.stringify({
        puzzle: data.puzzle,
        solution: data.solution,
        difficulty,
      }));
      
      setGameState({
        grid,
        selectedCell: null,
        timeElapsed: 0,
        mistakes: 0,
        hintsUsed: 0,
        isComplete: false,
        difficulty,
      });
      setSolution(newSolution);
      setIsRunning(true);
      setIsPaused(false);
      setNotesMode(false);
      setHint(null);
      setHintExplanation(null);
      setHintSuggestedNumber(null);
      setHintContext(null);
      setShowShareButton(false);
      setHasMintedCurrentSolve(false);
      
      soundManager.playClick();
      
      toast({
        title: "New Game Started",
        description: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty puzzle loaded`,
      });
    } catch (error) {
	      const { puzzle, solution: newSolution } = generateSudokuPuzzle(difficulty);
      const grid = createSudokuGrid(puzzle, newSolution);

      setGameState({
        grid,
        selectedCell: null,
        timeElapsed: 0,
        mistakes: 0,
        hintsUsed: 0,
        isComplete: false,
        difficulty,
      });
      setSolution(newSolution);
      setIsRunning(true);
      setIsPaused(false);
      setNotesMode(false);
      setHint(null);
      setHintExplanation(null);
      setHintSuggestedNumber(null);
      setHintContext(null);
      setShowShareButton(false);
      setHasMintedCurrentSolve(false);
      
      soundManager.playClick();
      
      toast({
        title: "New Game Started (Offline Mode)",
        description: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty puzzle generated locally`,
      });
    }
  };

  const startDailyChallenge = async (dateKey: string, difficulty: 'easy' | 'medium' | 'hard', slot: number) => {
    if (!walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Phantom wallet to start the AI Daily Challenge.",
        variant: "destructive",
      });
      return;
    }

    try {
      const storageKey = `sudoku_daily_${dateKey}_${difficulty}_${slot}`;
      let puzzleStr: string;
      let solutionStr: string;

        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          puzzleStr = parsed.puzzle;
          solutionStr = parsed.solution;
        } else {
          const res = await apiRequest('POST', '/api/puzzles/daily', { difficulty, dateKey, slot });
          const data = await res.json();
          puzzleStr = data.puzzle;
          solutionStr = data.solution;
          localStorage.setItem(storageKey, JSON.stringify({ puzzle: puzzleStr, solution: solutionStr, difficulty }));
        }

        // remember which daily slot is active so we can mark completion / mint correctly
        try {
          localStorage.setItem(
            "sudoku_daily_last_meta",
            JSON.stringify({ dateKey, slot })
          );
        } catch {
          // ignore
        }

      const puzzle = stringToGrid(puzzleStr);
      const newSolution = stringToGrid(solutionStr);
      const grid = createSudokuGrid(puzzle, newSolution);

      setGameState({
        grid,
        selectedCell: null,
        timeElapsed: 0,
        mistakes: 0,
        hintsUsed: 0,
        isComplete: false,
        difficulty,
      });
      setSolution(newSolution);
	      setIsRunning(true);
	      setIsPaused(false);
	      setNotesMode(false);
	      setHint(null);
	      setHintExplanation(null);
	      setHintSuggestedNumber(null);
	      setHintContext(null);
	      setShowShareButton(false);
	      setHasMintedCurrentSolve(false);
        setActiveChallengeDate(dateKey);
        setActiveChallengeSlot(slot);
	
	      soundManager.playClick();
	
	      toast({
	        title: "AI Daily Challenge Started",
	        description: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty daily puzzle loaded`,
	      });
	    } catch (error) {
        // fallback: use local generator but still keep same difficulty
	        const { puzzle, solution: newSolution } = generateSudokuPuzzle(difficulty);
	        const grid = createSudokuGrid(puzzle, newSolution);
	
	        // persist fallback daily so repeated clicks see the same board
	        try {
	          const puzzleStr = gridToString(puzzle);
	          const solutionStr = gridToString(newSolution);
	          const storageKey = `sudoku_daily_${dateKey}_${difficulty}_${slot}`;
	          localStorage.setItem(
	            storageKey,
	            JSON.stringify({ puzzle: puzzleStr, solution: solutionStr, difficulty })
	          );
            localStorage.setItem(
              "sudoku_daily_last_meta",
              JSON.stringify({ dateKey, slot })
            );
	        } catch {
	          // ignore storage errors
	        }
	
	        setGameState({
	          grid,
	          selectedCell: null,
	          timeElapsed: 0,
	          mistakes: 0,
	          hintsUsed: 0,
	          isComplete: false,
	          difficulty,
	        });
	        setSolution(newSolution);
	        setIsRunning(true);
	        setIsPaused(false);
	        setNotesMode(false);
	        setHint(null);
	        setHintExplanation(null);
	        setHintSuggestedNumber(null);
	        setHintContext(null);
	        setShowShareButton(false);
	        setHasMintedCurrentSolve(false);
          setActiveChallengeDate(dateKey);
          setActiveChallengeSlot(slot);
	
	        soundManager.playClick();
	
	        toast({
	          title: "AI Daily Challenge Started (Offline Mode)",
	          description: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty daily puzzle generated locally`,
	        });
	      }
	    };

  const handleCellSelect = (row: number, col: number) => {
    if (!gameState || gameState.isComplete || isPaused) return;
    
    const cell = gameState.grid[row][col];
    setGameState(prev => prev ? { ...prev, selectedCell: { row, col } } : null);

    if (cell.value > 0) {
      setHighlightNumber(cell.value);
    } else {
      setHighlightNumber(null);
    }

    setHint(null);
    setHintExplanation(null);
    setHintSuggestedNumber(null);
    setHintContext(null);
    soundManager.playClick();
  };

  const handleNumberInput = (num: number) => {
    if (!gameState || !gameState.selectedCell || gameState.isComplete || isPaused) return;

    const { row, col } = gameState.selectedCell;
    if (gameState.grid[row][col].isGiven) {
      soundManager.playError();
      return;
    }
    const newGrid = gameState.grid.map(r => r.map(c => ({ ...c })));

    if (notesMode) {
      const cell = newGrid[row][col];
      if (cell.notes.includes(num)) {
        cell.notes = cell.notes.filter(n => n !== num);
      } else {
        cell.notes = [...cell.notes, num].sort();
      }
      soundManager.playClick();
    } else {
      newGrid[row][col].value = num;
      newGrid[row][col].notes = [];

      const isCorrect = solution[row][col] === num;
      newGrid[row][col].isError = !isCorrect;

      if (isCorrect) {
        soundManager.playCorrect();
        clearErrorsInRow(newGrid, row);
        clearErrorsInCol(newGrid, col);
        clearErrorsInBox(newGrid, row, col);
      } else {
        soundManager.playError();
        setGameState(prev => prev ? { ...prev, mistakes: prev.mistakes + 1 } : null);
      }

      const isComplete = checkGridComplete(newGrid) && !hasErrors(newGrid);
      if (isComplete) {
        handlePuzzleComplete(newGrid);
        return;
      }
    }

    setGameState(prev => prev ? { ...prev, grid: newGrid } : null);
    setHint(null);
    setHintExplanation(null);
    setHintSuggestedNumber(null);
    setHintContext(null);
  };

  const handleNumberPadClick = (num: number) => {
    setHighlightNumber(num);
    handleNumberInput(num);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameState || gameState.isComplete) return;

      if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const currentRow = gameState.selectedCell?.row ?? 0;
        const currentCol = gameState.selectedCell?.col ?? 0;

        let newRow = currentRow;
        let newCol = currentCol;

        if (event.key === "ArrowUp") newRow = Math.max(0, currentRow - 1);
        if (event.key === "ArrowDown") newRow = Math.min(8, currentRow + 1);
        if (event.key === "ArrowLeft") newCol = Math.max(0, currentCol - 1);
        if (event.key === "ArrowRight") newCol = Math.min(8, currentCol + 1);

        setGameState(prev =>
          prev
            ? {
                ...prev,
                selectedCell: { row: newRow, col: newCol },
              }
            : prev
        );
        return;
      }

      if (event.key >= "1" && event.key <= "9") {
        if (isPaused) return;
        event.preventDefault();
        handleNumberInput(Number(event.key));
      }

      if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
        if (isPaused) return;
        event.preventDefault();
        handleErase();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, isPaused]);

  const clearErrorsInRow = (grid: SudokuGrid, row: number) => {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col].value === solution[row][col]) {
        grid[row][col].isError = false;
      }
    }
  };

  const clearErrorsInCol = (grid: SudokuGrid, col: number) => {
    for (let row = 0; row < 9; row++) {
      if (grid[row][col].value === solution[row][col]) {
        grid[row][col].isError = false;
      }
    }
  };

  const clearErrorsInBox = (grid: SudokuGrid, row: number, col: number) => {
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const r = boxRow + i;
        const c = boxCol + j;
        if (grid[r][c].value === solution[r][c]) {
          grid[r][c].isError = false;
        }
      }
    }
  };

  const hasErrors = (grid: SudokuGrid) => {
    return grid.some(row => row.some(cell => cell.isError));
  };

  const markDailyChallengeComplete = (dateKey: string, slot: number) => {
    setCompletedChallenges((prev) => {
      const existing = prev[dateKey] ?? [false, false, false, false, false, false];
      if (existing[slot]) return prev;
      const updatedSlots = existing.slice();
      updatedSlots[slot] = true;
      const next = { ...prev, [dateKey]: updatedSlots };
      localStorage.setItem('sudoku_daily_challenge_completed', JSON.stringify(next));
      return next;
    });
  };

  const markDailyChallengeMinted = (dateKey: string, slot: number) => {
    setMintedChallenges((prev) => {
      const existing = prev[dateKey] ?? [false, false, false, false, false, false];
      if (existing[slot]) return prev;
      const updatedSlots = existing.slice();
      updatedSlots[slot] = true;
      const next = { ...prev, [dateKey]: updatedSlots };
      localStorage.setItem("sudoku_daily_challenge_minted", JSON.stringify(next));
      return next;
    });
  };

  const handlePuzzleComplete = async (grid: SudokuGrid) => {
    setIsRunning(false);
    setIsPaused(false);
    setGameState(prev => (prev ? { ...prev, grid, isComplete: true } : null));

    soundManager.playSuccess();
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#a855f7", "#06b6d4", "#10b981"],
    });

    if (walletAddress && gameState) {
      try {
        const res = await apiRequest("GET", "/api/stats");
        const data = await res.json();
        setTotalParticipants(data.totalParticipants ?? totalParticipants);
        setTotalWallets(data.totalWallets ?? totalWallets);
      } catch {
        // ignore
      }
    }

    // For daily challenges, mark the specific slot as completed.
    // We use a special localStorage key to remember the last started slot.
    try {
      const metaRaw = localStorage.getItem("sudoku_daily_last_meta");
      if (metaRaw) {
        const meta = JSON.parse(metaRaw) as { dateKey?: string; slot?: number };
        if (meta.dateKey && typeof meta.slot === "number") {
          markDailyChallengeComplete(meta.dateKey, meta.slot);
        }
      }
    } catch {
      // ignore
    }

    setTimeout(() => {
      setShowNFTModal(true);
      setShowShareButton(true);
    }, 1000);
  };

  const handleErase = () => {
    if (!gameState || !gameState.selectedCell || gameState.isComplete || isPaused) return;

    const { row, col } = gameState.selectedCell;
    if (gameState.grid[row][col].isGiven) return;

    const newGrid = gameState.grid.map(r => r.map(c => ({ ...c })));
    newGrid[row][col].value = 0;
    newGrid[row][col].isError = false;
    newGrid[row][col].notes = [];

    setGameState(prev => prev ? { ...prev, grid: newGrid } : null);
    soundManager.playClick();
  };

  const handleRequestHint = async () => {
    if (!gameState) return;

    try {
      const grid = gameState.grid;
      let bestHint:
        | {
            row: number;
            col: number;
            candidates: number[];
            correctValue: number;
            mode: "row" | "col" | "box";
            explanation: string;
          }
        | null = null;
      let fallbackHint: typeof bestHint = null;

      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col].value !== 0) continue;

          const candidates = getHintsForCell(grid, row, col, solution);
          const correctValue = solution[row][col];
          if (!candidates.includes(correctValue)) continue;

          const isOnlyPlaceInRow = () => {
            for (let c = 0; c < 9; c++) {
              if (c === col) continue;
              const cell = grid[row][c];
              if (cell.value === 0) {
                const opts = getHintsForCell(grid, row, c, solution);
                if (opts.includes(correctValue)) return false;
              }
            }
            return true;
          };

          const isOnlyPlaceInCol = () => {
            for (let r = 0; r < 9; r++) {
              if (r === row) continue;
              const cell = grid[r][col];
              if (cell.value === 0) {
                const opts = getHintsForCell(grid, r, col, solution);
                if (opts.includes(correctValue)) return false;
              }
            }
            return true;
          };

          const isOnlyPlaceInBox = () => {
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            for (let r = boxRow; r < boxRow + 3; r++) {
              for (let c = boxCol; c < boxCol + 3; c++) {
                if (r === row && c === col) continue;
                const cell = grid[r][c];
                if (cell.value === 0) {
                  const opts = getHintsForCell(grid, r, c, solution);
                  if (opts.includes(correctValue)) return false;
                }
              }
            }
            return true;
          };

          if (isOnlyPlaceInRow()) {
            bestHint = {
              row,
              col,
              candidates,
              correctValue,
              mode: "row",
              explanation: `In this row, only this cell can be ${correctValue}. All other empty cells in the row would break Sudoku rules.`,
            };
            break;
          }

          if (isOnlyPlaceInCol()) {
            bestHint = {
              row,
              col,
              candidates,
              correctValue,
              mode: "col",
              explanation: `In this column, only this cell can be ${correctValue}. All other empty cells in the column would break Sudoku rules.`,
            };
            break;
          }

          if (isOnlyPlaceInBox()) {
            bestHint = {
              row,
              col,
              candidates,
              correctValue,
              mode: "box",
              explanation: `In this 3×3 block, only this cell can be ${correctValue}. The other cells in the block cannot contain ${correctValue}.`,
            };
            break;
          }

          if (!fallbackHint) {
            fallbackHint = {
              row,
              col,
              candidates,
              correctValue,
              mode: "box",
              explanation: `Based on Sudoku rules for row, column, and block, ${correctValue} is the only valid choice for this cell.`,
            };
          }
        }
        if (bestHint) break;
      }

      const hintToUse = bestHint || fallbackHint;
      if (!hintToUse) {
        toast({
          title: "No Hint Available",
          description: "The puzzle already looks complete or no safe hint could be found.",
        });
        return;
      }

      const { row, col, candidates, correctValue, mode, explanation } = hintToUse;

      setGameState(prev =>
        prev
          ? {
              ...prev,
              selectedCell: { row, col },
              hintsUsed: prev.hintsUsed + 1,
            }
          : prev
      );

      setHint(candidates);
      setHintExplanation(explanation);
      setHintSuggestedNumber(correctValue);
      setHintContext({ row, col, mode, value: correctValue });
      setHighlightNumber(correctValue);

      soundManager.playClick();

      toast({
        title: "CARV AI Hint",
        description: explanation,
      });
    } catch (error) {
      console.error("Failed to compute hint", error);
      toast({
        title: "Hint Error",
        description: "CARV AI could not generate a hint right now.",
        variant: "destructive",
      });
    }
  };

  const handleMintNFT = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Phantom wallet to mint NFT",
        variant: "destructive",
      });
      throw new Error("Wallet not connected");
    }

    try {
      if (!publicKey || !sendTransaction) {
        throw new Error("Wallet adapter not ready");
      }

      const memoData = JSON.stringify({
        app: "CARV Sudoku",
        difficulty: gameState?.difficulty,
        time: gameState?.timeElapsed,
        hintsUsed: gameState?.hintsUsed,
        timestamp: Date.now(),
      });

      const encoder = new TextEncoder();
      const data = encoder.encode(memoData);
      const memoProgramId = new PublicKey(MEMO_PROGRAM_ID);

      const instruction = new TransactionInstruction({
        keys: [],
        programId: memoProgramId,
        data,
      });

      const tx = new Transaction().add(instruction);
      tx.feePayer = publicKey;

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");
      setLastSolveTx(signature);

      const entry = await submitLeaderboardMutation.mutateAsync({
        walletAddress,
        time: gameState?.timeElapsed ?? 0,
        difficulty: gameState?.difficulty ?? "medium",
        hintsUsed: gameState?.hintsUsed ?? 0,
      } as any);

      const puzzleId = entry?.id ?? `run_${Date.now()}`;

	      await mintNFTMutation.mutateAsync({
	        walletAddress,
	        puzzleId,
	        txSignature: signature,
	      } as any);

        // mark the corresponding daily slot as minted if we have metadata
        try {
          const metaRaw = localStorage.getItem("sudoku_daily_last_meta");
          if (metaRaw) {
            const meta = JSON.parse(metaRaw) as { dateKey?: string; slot?: number };
            if (meta.dateKey && typeof meta.slot === "number") {
              markDailyChallengeMinted(meta.dateKey, meta.slot);
            }
          }
        } catch {
          // ignore
        }

      toast({
        title: "NFT Minted!",
        description: "Your Sudoku Soul NFT has been minted on CARV Testnet",
      });
      setHasMintedCurrentSolve(true);

      try {
        const res = await apiRequest('GET', '/api/stats');
        const data = await res.json();
        setTotalParticipants(data.totalParticipants ?? totalParticipants);
        setTotalWallets(data.totalWallets ?? totalWallets);
      } catch {
        // ignore
      }
    } catch (error: any) {
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to mint NFT",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleResetGame = () => {
    if (!gameState) return;

    const resetGrid: SudokuGrid = gameState.grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        value: cell.isGiven ? cell.value : 0,
        isError: false,
        notes: [],
      }))
    );

    setGameState((prev) =>
      prev
        ? {
            ...prev,
            grid: resetGrid,
            selectedCell: null,
            timeElapsed: 0,
            mistakes: 0,
            hintsUsed: 0,
            isComplete: false,
          }
        : prev
    );
    setIsRunning(false);
    setIsPaused(false);
    setHint(null);
    setHintExplanation(null);
    setHintSuggestedNumber(null);
    setHintContext(null);
    setShowShareButton(false);
    setHasMintedCurrentSolve(false);
    soundManager.playClick();
  };

  const completedNumbers =
    gameState && solution.length === 9
      ? Array.from({ length: 9 }, (_, i) => i + 1).filter((num) => {
          let totalNeeded = 0;
          let correctlyPlaced = 0;

          for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
              if (solution[row][col] === num) {
                totalNeeded++;
                if (gameState.grid[row][col].value === num && !gameState.grid[row][col].isError) {
                  correctlyPlaced++;
                }
              }
            }
          }

          return totalNeeded > 0 && correctlyPlaced >= totalNeeded;
        })
      : [];

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-display font-bold bg-gradient-to-r from-carv-purple to-blockchain-blue bg-clip-text text-transparent">
                CARV Sudoku
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <SoundToggle />
              <ThemeToggle />
              <WalletConnect />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-semibold">Connect Your Wallet</h2>
              <p className="text-sm text-muted-foreground">
                You need to connect your Phantom wallet on CARV SVM Testnet to start playing and minting Sudoku Soul NFTs.
              </p>
            </div>
            <div className="mt-4 flex justify-center">
              <WalletConnect />
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-carv-purple to-blockchain-blue bg-clip-text text-transparent">
              CARV Sudoku
            </h1>
            <Badge className="mt-1" variant="outline">Loading puzzle...</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Preparing a fresh medium-difficulty puzzle on CARV SVM Testnet.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-display font-bold bg-gradient-to-r from-carv-purple to-blockchain-blue bg-clip-text text-transparent">
              CARV Sudoku
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <SoundToggle />
            <ThemeToggle />
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
	            <div className="space-y-2">
	              <DailyChallenge
	                completedDates={Object.keys(completedChallenges)}
	                totalParticipants={totalParticipants}
	                totalWallets={totalWallets}
	                mintedDates={Object.keys(mintedChallenges)}
	                activeDate={activeChallengeDate}
	                completedSlotsByDate={completedChallenges}
	                mintedSlotsByDate={mintedChallenges}
	                activeSlotIndex={activeChallengeSlot}
	                onStartChallenge={({ difficulty, dateKey, slot }) => {
	                  void startDailyChallenge(dateKey, difficulty, slot);
	                }}
	              />
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleResetDailyProgress}
                >
                  Reset AI Daily Progress
                </Button>
              </div>
            </div>

            <Card className="p-4 space-y-4">
              <div className="flex flex-col items-center mb-1">
                <h2 className="text-lg font-semibold">Sudoku Board</h2>
                {activeChallengeDate && (
                  <p className="text-[11px] text-muted-foreground">
                    Current puzzle: Day {parseInt(activeChallengeDate.slice(8, 10), 10)}
                    {activeChallengeSlot != null && (
                      <>
                        {" "}
                        •{" "}
                        {activeChallengeSlot === 0 && "Easy 1"}
                        {activeChallengeSlot === 1 && "Easy 2"}
                        {activeChallengeSlot === 2 && "Easy 3"}
                        {activeChallengeSlot === 3 && "Medium 1"}
                        {activeChallengeSlot === 4 && "Medium 2"}
                        {activeChallengeSlot === 5 && "Hard"}
                      </>
                    )}
                  </p>
                )}
              </div>

              <GameStats
                timeElapsed={gameState.timeElapsed}
                mistakes={gameState.mistakes}
                hintsUsed={gameState.hintsUsed}
                difficulty={gameState.difficulty}
                isRunning={isRunning}
                isComplete={gameState.isComplete}
                onToggleRunning={() => {
                  if (gameState.isComplete) return;
                  setIsPaused(!isPaused);
                  setIsRunning(!isRunning);
                }}
                onReset={handleResetGame}
              />

              {gameState.isComplete && walletAddress && !hasMintedCurrentSolve && (
                <div className="px-2 -mt-1">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 rounded-md border border-amber-300 bg-amber-50">
                    <div className="flex items-center gap-2 text-[11px] text-amber-800">
                      <AlertTriangle className="w-3 h-3" />
                      <span>
                        Don&apos;t forget to mint your{" "}
                        <span className="font-semibold">Sudoku Soul</span> NFT to keep this solve on-chain.
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs bg-gradient-to-r from-carv-purple to-blockchain-blue text-white"
                      onClick={() => setShowNFTModal(true)}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Mint Sudoku Soul NFT
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <div className="flex-1">
                  <div className="aspect-square max-w-2xl mx-auto relative">
                    <SudokuCanvas
                      grid={gameState.grid}
                      selectedCell={gameState.selectedCell}
                      onCellSelect={handleCellSelect}
                      showNotes={true}
                      hideNumbers={isPaused}
                      highlightNumber={highlightNumber}
                      hintContext={hintContext}
                    />
                    {isPaused && !gameState.isComplete && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsPaused(false);
                          setIsRunning(true);
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-background/70"
                      >
                        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                          <Play className="w-7 h-7 text-white" />
                        </div>
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full md:w-auto md:flex md:items-center md:justify-center">
                  <NumberPad
                    onNumberSelect={handleNumberPadClick}
                    onErase={handleErase}
                    onToggleNotes={() => setNotesMode(!notesMode)}
                    notesMode={notesMode}
                    disabled={gameState.isComplete}
                    completedNumbers={completedNumbers}
                  />
                </div>
              </div>

              {lastSolveTx && (
                <div className="px-2 pt-1 text-xs text-muted-foreground text-center">
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={() =>
                      window.open(
                        `https://explorer.testnet.carv.io/tx/${lastSolveTx}`,
                        "_blank"
                      )
                    }
                  >
                    View last solve on CARV SVM Explorer
                  </button>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-28 self-start">
            <AIHintPanel
              onRequestHint={handleRequestHint}
              hint={hint}
              explanation={hintExplanation}
              suggestedNumber={hintSuggestedNumber}
              onApplyHint={() => {
                if (!gameState || gameState.isComplete || hintSuggestedNumber == null) return;
                if (!gameState.selectedCell) return;
                handleNumberInput(hintSuggestedNumber);
              }}
              disabled={gameState.isComplete}
              hintsRemaining={10 - gameState.hintsUsed}
            />
            
            <Leaderboard />
          </div>
        </div>
      </main>

      <NFTMintModal
        open={showNFTModal}
        onClose={() => setShowNFTModal(false)}
        stats={{
          time: gameState.timeElapsed,
          difficulty: gameState.difficulty,
          hintsUsed: gameState.hintsUsed,
        }}
        onMint={handleMintNFT}
      />

      {showShareButton && gameState.isComplete && (
        <ShareToX time={gameState.timeElapsed} difficulty={gameState.difficulty} />
      )}
    </div>
  );
}

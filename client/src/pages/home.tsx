import { useState, useEffect, useCallback } from "react";
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
import { Play, RotateCcw, Pause } from "lucide-react";
import { generateSudokuPuzzle, createSudokuGrid, checkGridComplete, getHintsForCell, gridToString } from "@/lib/sudoku";
import { soundManager } from "@/lib/sounds";
import type { SudokuGrid, GameState } from "@shared/schema";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [solution, setSolution] = useState<number[][]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [notesMode, setNotesMode] = useState(false);
  const [hint, setHint] = useState<number[] | null>(null);
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [showShareButton, setShowShareButton] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkWallet = async () => {
      try {
        const { solana } = window as any;
        if (solana?.isPhantom && solana.isConnected) {
          const response = await solana.connect({ onlyIfTrusted: true });
          setWalletAddress(response.publicKey.toString());
        }
      } catch (error) {
        console.log('Wallet not connected');
      }
    };
    checkWallet();

    const handleConnect = (publicKey: any) => {
      setWalletAddress(publicKey.toString());
    };

    const { solana } = window as any;
    if (solana) {
      solana.on('connect', handleConnect);
      return () => {
        solana.off('connect', handleConnect);
      };
    }
  }, []);

  const submitLeaderboardMutation = useMutation({
    mutationFn: async (data: { walletAddress: string; time: number; difficulty: string; hintsUsed: number }) => {
      return apiRequest('POST', '/api/leaderboard', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
    },
  });

  const mintNFTMutation = useMutation({
    mutationFn: async (data: { walletAddress: string; puzzleId: string }) => {
      return apiRequest('POST', '/api/nft/mint', data);
    },
  });

  useEffect(() => {
    const savedState = localStorage.getItem('sudoku_game_state');
    if (savedState) {
      const state = JSON.parse(savedState);
      setGameState(state.gameState);
      setSolution(state.solution);
      setIsRunning(false);
    }
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

  const startNewGame = (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    const { puzzle, solution: newSolution } = generateSudokuPuzzle(difficulty);
    const grid = createSudokuGrid(puzzle, newSolution);
    
    const puzzleId = `puzzle_${Date.now()}_${difficulty}`;
    localStorage.setItem(`puzzle_${puzzleId}`, JSON.stringify({
      puzzle: gridToString(puzzle),
      solution: gridToString(newSolution),
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
    setNotesMode(false);
    setHint(null);
    setShowShareButton(false);
    
    soundManager.playClick();
    
    toast({
      title: "New Game Started",
      description: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty puzzle loaded`,
    });
  };

  const handleCellSelect = (row: number, col: number) => {
    if (!gameState || gameState.isComplete) return;
    
    const cell = gameState.grid[row][col];
    if (cell.isGiven) {
      soundManager.playError();
      return;
    }

    setGameState(prev => prev ? { ...prev, selectedCell: { row, col } } : null);
    setHint(null);
    soundManager.playClick();
  };

  const handleNumberInput = (num: number) => {
    if (!gameState || !gameState.selectedCell || gameState.isComplete) return;

    const { row, col } = gameState.selectedCell;
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
  };

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

  const handlePuzzleComplete = async (grid: SudokuGrid) => {
    setIsRunning(false);
    setGameState(prev => prev ? { ...prev, grid, isComplete: true } : null);
    
    soundManager.playSuccess();
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#06b6d4', '#10b981'],
    });

    if (walletAddress && gameState) {
      try {
        await submitLeaderboardMutation.mutateAsync({
          walletAddress,
          time: gameState.timeElapsed,
          difficulty: gameState.difficulty,
          hintsUsed: gameState.hintsUsed,
        });
      } catch (error) {
        console.error('Failed to submit to leaderboard:', error);
      }
    }

    setTimeout(() => {
      setShowNFTModal(true);
      setShowShareButton(true);
    }, 1000);
  };

  const handleErase = () => {
    if (!gameState || !gameState.selectedCell || gameState.isComplete) return;

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
    if (!gameState || !gameState.selectedCell) {
      toast({
        title: "Select a Cell",
        description: "Please select an empty cell to get a hint",
        variant: "destructive",
      });
      return;
    }

    const { row, col } = gameState.selectedCell;
    
    try {
      const response = await apiRequest('POST', '/api/hints/generate', {
        grid: gameState.grid,
        row,
        col,
        solution,
      });
      
      setHint(response.hints);
      setGameState(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : null);
      soundManager.playClick();
      
      toast({
        title: "CARV AI Hint",
        description: response.message,
      });
    } catch (error: any) {
      const hints = getHintsForCell(gameState.grid, row, col, solution);
      setHint(hints);
      setGameState(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : null);
      soundManager.playClick();
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await mintNFTMutation.mutateAsync({
        walletAddress,
        puzzleId: `puzzle_${Date.now()}`,
      });

      toast({
        title: "NFT Minted!",
        description: "Your Sudoku Soul NFT has been minted on CARV Testnet",
      });
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
    if (gameState) {
      startNewGame(gameState.difficulty as any);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-carv-purple to-blockchain-blue bg-clip-text text-transparent">
              CARV Sudoku
            </h1>
            <p className="text-xl text-muted-foreground">AI vs Human</p>
            <Badge className="mt-2" variant="outline">#CARVHackathon</Badge>
          </div>

          <div className="space-y-3">
            <p className="text-muted-foreground">
              Play blockchain-powered Sudoku with AI hints and mint NFTs on CARV Testnet
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => startNewGame('easy')}
              size="lg"
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              data-testid="button-start-easy"
            >
              <span className="text-lg font-semibold">Easy</span>
              <span className="text-xs text-muted-foreground">Perfect for beginners</span>
            </Button>
            <Button
              onClick={() => startNewGame('medium')}
              size="lg"
              className="h-auto py-4 flex-col gap-2 bg-gradient-to-r from-carv-purple to-blockchain-blue"
              data-testid="button-start-medium"
            >
              <span className="text-lg font-semibold">Medium</span>
              <span className="text-xs">Balanced challenge</span>
            </Button>
            <Button
              onClick={() => startNewGame('hard')}
              size="lg"
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              data-testid="button-start-hard"
            >
              <span className="text-lg font-semibold">Hard</span>
              <span className="text-xs text-muted-foreground">Expert level</span>
            </Button>
          </div>
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
            <Badge variant="outline" className="hidden sm:inline-flex">#CARVHackathon</Badge>
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
            <DailyChallenge onStartChallenge={() => startNewGame('hard')} />
            
            <GameStats
              timeElapsed={gameState.timeElapsed}
              mistakes={gameState.mistakes}
              hintsUsed={gameState.hintsUsed}
              difficulty={gameState.difficulty}
              isRunning={isRunning}
            />

            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Sudoku Board</h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRunning(!isRunning)}
                    disabled={gameState.isComplete}
                    data-testid="button-pause-resume"
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetGame}
                    data-testid="button-reset-game"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="aspect-square max-w-2xl mx-auto">
                <SudokuCanvas
                  grid={gameState.grid}
                  selectedCell={gameState.selectedCell}
                  onCellSelect={handleCellSelect}
                  showNotes={true}
                />
              </div>
            </Card>

            <NumberPad
              onNumberSelect={handleNumberInput}
              onErase={handleErase}
              onToggleNotes={() => setNotesMode(!notesMode)}
              notesMode={notesMode}
              disabled={gameState.isComplete}
            />
          </div>

          <div className="space-y-6">
            <AIHintPanel
              onRequestHint={handleRequestHint}
              hint={hint}
              disabled={!gameState.selectedCell || gameState.isComplete}
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

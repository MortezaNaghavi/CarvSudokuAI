import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface NFTMintModalProps {
  open: boolean;
  onClose: () => void;
  stats: {
    time: number;
    difficulty: string;
    hintsUsed: number;
  };
  onMint: () => Promise<void>;
}

export function NFTMintModal({ open, onClose, stats, onMint }: NFTMintModalProps) {
  const [mintStatus, setMintStatus] = useState<'idle' | 'minting' | 'success' | 'error'>('idle');
  const [txSignature, setTxSignature] = useState<string>('');

  const handleMint = async () => {
    try {
      setMintStatus('minting');
      await onMint();
      setMintStatus('success');
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#06b6d4', '#10b981'],
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#a855f7', '#06b6d4'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#a855f7', '#06b6d4'],
        });
      }, 250);
    } catch (error: any) {
      setMintStatus('error');
      console.error('Mint error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="modal-nft-mint">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-carv-purple" />
            Puzzle Completed!
          </DialogTitle>
          <DialogDescription>
            Mint your "Sudoku Soul" NFT on CARV Testnet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="p-4 bg-gradient-to-br from-carv-purple/10 to-blockchain-blue/10 border-carv-purple/20">
            <div className="aspect-square rounded-md bg-gradient-to-br from-carv-purple to-blockchain-blue flex items-center justify-center mb-4">
              <div className="text-center text-white">
                <div className="text-6xl font-bold mb-2">🧩</div>
                <p className="text-sm font-medium">Sudoku Soul #{Math.floor(Math.random() * 10000)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completion Time</span>
                <span className="font-mono font-semibold">{formatTime(stats.time)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Difficulty</span>
                <Badge className="capitalize">{stats.difficulty}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">AI Hints Used</span>
                <span className="font-mono font-semibold">{stats.hintsUsed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="text-sm font-medium">CARV Testnet</span>
              </div>
            </div>
          </Card>

          {mintStatus === 'idle' && (
            <Button
              onClick={handleMint}
              className="w-full gap-2 bg-gradient-to-r from-carv-purple to-blockchain-blue hover:opacity-90"
              size="lg"
              data-testid="button-mint-nft"
            >
              <Sparkles className="w-4 h-4" />
              Mint NFT on CARV
            </Button>
          )}

          {mintStatus === 'minting' && (
            <div className="text-center py-6">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-carv-purple" />
              <p className="font-medium">Minting your NFT...</p>
              <p className="text-sm text-muted-foreground mt-1">Verifying puzzle on-chain</p>
            </div>
          )}

          {mintStatus === 'success' && (
            <div className="text-center py-6" data-testid="div-mint-success">
              <div className="w-16 h-16 rounded-full bg-success-green/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success-green" />
              </div>
              <p className="font-medium text-lg mb-2">NFT Minted Successfully!</p>
              <p className="text-sm text-muted-foreground mb-4">
                Your Sudoku Soul NFT has been minted on CARV Testnet
              </p>
              <Button onClick={onClose} className="w-full" data-testid="button-close-modal">
                Close
              </Button>
            </div>
          )}

          {mintStatus === 'error' && (
            <div className="text-center py-6" data-testid="div-mint-error">
              <div className="w-16 h-16 rounded-full bg-error-red/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-error-red" />
              </div>
              <p className="font-medium text-lg mb-2">Minting Failed</p>
              <p className="text-sm text-muted-foreground mb-4">
                Please try again or check your wallet connection
              </p>
              <div className="flex gap-2">
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Close
                </Button>
                <Button onClick={handleMint} className="flex-1" data-testid="button-retry-mint">
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { SiX } from "react-icons/si";

interface ShareToXProps {
  time: number;
  difficulty: string;
}

export function ShareToX({ time, difficulty }: ShareToXProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShare = () => {
    const text = `Just solved a ${difficulty} Sudoku in ${formatTime(time)} on CARV! 🧩⛓️\n\nPlay blockchain-powered Sudoku with AI hints and mint NFTs on CARV Testnet.\n\n#CARVHackathon #SudokuSoul #Web3Gaming`;
    const url = window.location.origin;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    
    window.open(tweetUrl, '_blank', 'width=550,height=420');
  };

  return (
    <Button
      onClick={handleShare}
      size="lg"
      className="fixed bottom-6 right-6 rounded-full shadow-lg gap-2 bg-black hover:bg-black/90 text-white z-50"
      data-testid="button-share-to-x"
    >
      <SiX className="w-4 h-4" />
      Share to X
    </Button>
  );
}

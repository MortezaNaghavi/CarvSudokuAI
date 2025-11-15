import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, Lightbulb, Play, Pause, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

interface GameStatsProps {
  timeElapsed: number;
  mistakes: number;
  hintsUsed: number;
  difficulty: string;
  isRunning: boolean;
  isComplete?: boolean;
  onToggleRunning?: () => void;
  onReset?: () => void;
}

export function GameStats({
  timeElapsed,
  mistakes,
  hintsUsed,
  difficulty,
  isRunning,
  isComplete,
  onToggleRunning,
  onReset,
}: GameStatsProps) {
  const [displayTime, setDisplayTime] = useState(timeElapsed);

  useEffect(() => {
    setDisplayTime(timeElapsed);
  }, [timeElapsed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = () => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-success-green text-white';
      case 'medium': return 'bg-blockchain-blue text-white';
      case 'hard': return 'bg-error-red text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <div className="flex items-center gap-3" data-testid="stat-timer">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Time</p>
              <p className="text-lg font-mono font-semibold">{formatTime(displayTime)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3" data-testid="stat-difficulty">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
              <Badge className={`${getDifficultyColor()} text-xs`}>
                {difficulty[0]}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Difficulty</p>
              <p className="text-lg font-semibold capitalize">{difficulty}</p>
            </div>
          </div>

          <div className="flex items-center gap-3" data-testid="stat-mistakes">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
              <AlertCircle className={`w-5 h-5 ${mistakes >= 3 ? 'text-error-red' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Mistakes</p>
              <p className="text-lg font-mono font-semibold">
                <span className={mistakes >= 3 ? 'text-error-red' : ''}>{mistakes}</span>
                <span className="text-muted-foreground">/3</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3" data-testid="stat-hints">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
              <Lightbulb className="w-5 h-5 text-ai-cyan" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Hints Used</p>
              <p className="text-lg font-mono font-semibold">{hintsUsed}</p>
            </div>
          </div>
        </div>

        {(onToggleRunning || onReset) && (
          <div className="flex items-center justify-end gap-2">
            {onToggleRunning && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleRunning}
                disabled={isComplete}
                data-testid="button-pause-resume"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            )}
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                data-testid="button-reset-game"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

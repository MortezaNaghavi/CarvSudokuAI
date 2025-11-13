import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Zap, Gift, Clock, Trophy } from "lucide-react";
import { useState, useEffect } from "react";

interface DailyChallengeProps {
  onStartChallenge: () => void;
}

export function DailyChallenge({ onStartChallenge }: DailyChallengeProps) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-carv-purple/30 bg-gradient-to-br from-card to-carv-purple/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-carv-purple/10">
              <Calendar className="w-5 h-5 text-carv-purple" />
            </div>
            <div>
              <CardTitle className="text-lg">Daily AI Challenge</CardTitle>
              <CardDescription>Compete against CARV AI for rewards</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1 border-carv-purple/30" data-testid="badge-time-remaining">
            <Clock className="w-3 h-3" />
            {timeRemaining}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
            <Zap className="w-5 h-5 text-blockchain-blue" />
            <div>
              <p className="text-xs text-muted-foreground">Difficulty</p>
              <p className="font-semibold">Hard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
            <Gift className="w-5 h-5 text-success-green" />
            <div>
              <p className="text-xs text-muted-foreground">Reward</p>
              <p className="font-semibold">2x NFT Boost</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
            <Trophy className="w-5 h-5 text-carv-purple" />
            <div>
              <p className="text-xs text-muted-foreground">Participants</p>
              <p className="font-semibold">247 players</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-md bg-gradient-to-r from-carv-purple/10 to-blockchain-blue/10 border border-carv-purple/20">
          <p className="text-sm font-medium mb-2">Today's Challenge</p>
          <p className="text-xs text-muted-foreground">
            Beat the AI's solve time to earn a special "AI Crusher" badge and double NFT rewards. 
            Limited to one attempt per day.
          </p>
        </div>

        <Button
          onClick={onStartChallenge}
          className="w-full gap-2 bg-gradient-to-r from-carv-purple to-blockchain-blue hover:opacity-90"
          size="lg"
          data-testid="button-start-daily-challenge"
        >
          <Zap className="w-4 h-4" />
          Start Daily Challenge
        </Button>
      </CardContent>
    </Card>
  );
}

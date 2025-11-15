import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Zap, Gift, Clock, Trophy, Check, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

interface DailyChallengeProps {
  onStartChallenge: (options: { difficulty: "easy" | "medium" | "hard"; dateKey: string; slot: number }) => void;
  completedDates: string[];
  totalParticipants: number;
  totalWallets: number;
  activeDate?: string | null;
  mintedDates?: string[];
  completedSlotsByDate?: Record<string, boolean[]>;
  mintedSlotsByDate?: Record<string, boolean[]>;
  activeSlotIndex?: number | null;
}

export function DailyChallenge({
  onStartChallenge,
  completedDates,
  totalParticipants,
  totalWallets,
  activeDate,
  mintedDates = [],
  completedSlotsByDate = {},
  mintedSlotsByDate = {},
  activeSlotIndex = null,
}: DailyChallengeProps) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<number>(0);

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      // Next reset is at 00:00 UTC of the next day
      const nextUtcMidnight = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          0,
          0,
          0,
          0,
        ),
      );

      const diff = nextUtcMidnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, []);

  // Use UTC date for daily challenge boundaries
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const today = new Date(Date.UTC(utcYear, utcMonth, now.getUTCDate()));

  const startOfMonth = new Date(Date.UTC(utcYear, utcMonth, 1));
  const daysInMonth = new Date(Date.UTC(utcYear, utcMonth + 1, 0)).getUTCDate();
  const startWeekday = startOfMonth.getUTCDay(); // 0 (Sun) - 6 (Sat)

  const days: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(Date.UTC(utcYear, utcMonth, d)));
  }

  const getAIDifficultyForDate = (date: Date): "easy" | "medium" | "hard" => {
    const day = date.getDate();
    const mod = day % 3;
    if (mod === 0) return "hard";
    if (mod === 1) return "easy";
    return "medium";
  };

  // Six daily slots per day: 3 easy, 2 medium, 1 hard
  const slots: { label: string; difficulty: "easy" | "medium" | "hard" }[] = [
    { label: "Easy 1", difficulty: "easy" },
    { label: "Easy 2", difficulty: "easy" },
    { label: "Easy 3", difficulty: "easy" },
    { label: "Medium 1", difficulty: "medium" },
    { label: "Medium 2", difficulty: "medium" },
    { label: "Hard", difficulty: "hard" },
  ];

  const selectedSlotConfig = slots[selectedSlot] ?? slots[0];

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
              <p className="text-xs text-muted-foreground">Selected Challenge</p>
              <p className="font-semibold capitalize">
                {selectedSlotConfig.difficulty} • {selectedSlotConfig.label}
              </p>
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
              <p className="text-xs text-muted-foreground">Participants (Minted)</p>
              <p className="font-semibold">{totalParticipants} players</p>
            </div>
          </div>
        </div>

          <div className="p-4 rounded-md bg-gradient-to-r from-carv-purple/10 to-blockchain-blue/10 border border-carv-purple/20 space-y-3">
          <p className="text-sm font-medium">AI Daily Calendar</p>
          <p className="text-xs text-muted-foreground">
            Select a day, then pick one of 6 AI challenges for that day (3 easy, 2 medium, 1 hard).
          </p>

          <div className="mt-2">
            <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-muted-foreground mb-1">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={index} className="h-7" />;
                }

                const dateKey = date.toISOString().slice(0, 10);
                const isToday =
                  date.getUTCDate() === today.getUTCDate() &&
                  date.getUTCMonth() === today.getUTCMonth() &&
                  date.getUTCFullYear() === today.getUTCFullYear();

                const isSelected =
                  date.getUTCDate() === selectedDate.getUTCDate() &&
                  date.getUTCMonth() === selectedDate.getUTCMonth() &&
                  date.getUTCFullYear() === selectedDate.getUTCFullYear();

                const inFuture = date.getTime() > today.getTime();
                const slotCompleted = completedSlotsByDate[dateKey] ?? [false, false, false, false, false, false];
                const slotMinted = mintedSlotsByDate[dateKey] ?? [false, false, false, false, false, false];

                const completedCount = slotCompleted.filter(Boolean).length;
                const mintedCount = slotMinted.filter(Boolean).length;

                const isCompleted = completedCount > 0;
                // day considered fully minted when all 6 slots minted
                const isMinted = mintedCount === 6 && mintedCount > 0;
                const isMintPending = isCompleted && !isMinted;
                const isActive = activeDate === dateKey;

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    disabled={inFuture || isCompleted}
                    onClick={() => setSelectedDate(date)}
                    className={`h-7 text-xs rounded-md flex items-center justify-center border relative
                      ${inFuture ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-carv-purple/10"}
                      ${isSelected ? "bg-carv-purple text-white border-carv-purple" : "border-border bg-background/80"}
                      ${isToday && !isSelected ? "ring-1 ring-carv-purple/50" : ""}
                      ${isMinted ? "bg-emerald-500 text-white border-emerald-500" : ""}
                      ${isMintPending ? "bg-emerald-400 text-white border-amber-400" : ""}
                      ${isActive && !isCompleted ? "ring-2 ring-blue-500" : ""}
                    `}
                  >
                    {date.getDate()}
                    {isMinted && (
                      <Check className="w-3 h-3 absolute top-0.5 right-0.5" />
                    )}
                    {isMintPending && (
                      <AlertTriangle className="w-3 h-3 absolute top-0.5 right-0.5 text-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot, index) => {
                const dateKey = selectedDate.toISOString().slice(0, 10);
                const slotCompleted = completedSlotsByDate[dateKey] ?? [false, false, false, false, false, false];
                const slotMinted = mintedSlotsByDate[dateKey] ?? [false, false, false, false, false, false];
                const isCompletedSlot = slotCompleted[index];
                const isMintedSlot = slotMinted[index];
                const isMintPendingSlot = isCompletedSlot && !isMintedSlot;
                const isActiveSlot =
                  activeDate === dateKey && activeSlotIndex != null && activeSlotIndex === index;

                return (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => setSelectedSlot(index)}
                    className={`text-xs py-1.5 px-2 rounded-md border flex items-center justify-between gap-1 transition
                      ${selectedSlot === index
                        ? "bg-carv-purple text-white border-carv-purple"
                        : "bg-background/80 border-border hover:bg-carv-purple/10"
                      }
                      ${isActiveSlot ? "ring-2 ring-blue-500" : ""}
                    `}
                  >
                    <span className="truncate">{slot.label}</span>
                    {isMintedSlot && <Check className="w-3 h-3 text-emerald-500" />}
                    {isMintPendingSlot && !isMintedSlot && (
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() =>
                onStartChallenge({
                  difficulty: selectedSlotConfig.difficulty,
                  dateKey: selectedDate.toISOString().slice(0, 10),
                  slot: selectedSlot,
                })
              }
              className="w-full gap-2 bg-gradient-to-r from-carv-purple to-blockchain-blue hover:opacity-90"
              size="lg"
              data-testid="button-start-daily-challenge"
            >
              <Zap className="w-4 h-4" />
              Play AI Daily Challenge
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

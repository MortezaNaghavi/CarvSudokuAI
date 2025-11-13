import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Medal, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { LeaderboardEntry } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export function Leaderboard() {
  const { data: entries, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard'],
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
    }
  };

  const sortedEntries = entries?.slice().sort((a, b) => a.time - b.time) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-carv-purple/10">
            <Trophy className="w-4 h-4 text-carv-purple" />
          </div>
          <CardTitle className="text-base">Global Leaderboard</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all" data-testid="tab-leaderboard-all">All Time</TabsTrigger>
            <TabsTrigger value="daily" data-testid="tab-leaderboard-daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly" data-testid="tab-leaderboard-weekly">Weekly</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sortedEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No entries yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-2" data-testid="list-leaderboard-entries">
                {sortedEntries.slice(0, 10).map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-3 rounded-md hover-elevate border"
                    data-testid={`row-leaderboard-${index}`}
                  >
                    <div className="flex items-center justify-center w-10">
                      {getRankIcon(index + 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium truncate">
                        {formatAddress(entry.walletAddress)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {entry.difficulty}
                        </Badge>
                        {entry.hintsUsed > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {entry.hintsUsed} hints
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold">{formatTime(entry.time)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.completedAt!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="daily" className="mt-0">
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Daily leaderboard coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="mt-0">
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Weekly leaderboard coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

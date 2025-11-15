import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Medal, Award, ExternalLink } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LeaderboardEntry, NftMint } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@solana/wallet-adapter-react";

const PAGE_SIZE = 10;

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  }
}

type DifficultyFilter = "all" | "easy" | "medium" | "hard";

function filterByDifficulty(entries: LeaderboardEntry[], difficulty: DifficultyFilter) {
  if (difficulty === "all") return entries;
  return entries.filter((e) => e.difficulty === difficulty);
}

export function Leaderboard() {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toString() || null;
  const queryClient = useQueryClient();

  const { data: globalEntries, isLoading: isLoadingGlobal } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const { data: myEntries, isLoading: isLoadingMy } = useQuery<LeaderboardEntry[]>({
    queryKey: walletAddress ? [`/api/leaderboard?walletAddress=${walletAddress}`] : [],
    enabled: !!walletAddress,
  });

  const { data: myMints } = useQuery<NftMint[]>({
    queryKey: walletAddress ? [`/api/nft/wallet/${walletAddress}`] : [],
    enabled: !!walletAddress,
  });

  const mintsByPuzzleId: Record<string, NftMint> = {};
  (myMints || []).forEach((m) => {
    mintsByPuzzleId[m.puzzleId] = m;
  });

  const sortedGlobal = (globalEntries || []).slice().sort((a, b) => a.time - b.time);
  const sortedMy = (myEntries || []).slice().sort((a, b) => a.time - b.time);

  const [scope, setScope] = useState<"global" | "wallet">("global");
  const [difficultyTab, setDifficultyTab] = useState<DifficultyFilter>("all");
  const [pageGlobal, setPageGlobal] = useState(0);
  const [pageMy, setPageMy] = useState(0);

  const currentEntries =
    scope === "global"
      ? filterByDifficulty(sortedGlobal, difficultyTab)
      : filterByDifficulty(sortedMy, difficultyTab);

  const totalPages = Math.max(1, Math.ceil(currentEntries.length / PAGE_SIZE));
  const page = scope === "global" ? pageGlobal : pageMy;
  const setPage = scope === "global" ? setPageGlobal : setPageMy;

  const pageEntries = currentEntries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const isLoading = scope === "global" ? isLoadingGlobal : isLoadingMy;

  const handleScopeChange = (val: string) => {
    const newScope = val === "wallet" ? "wallet" : "global";
    setScope(newScope);
    setPageGlobal(0);
    setPageMy(0);
  };

  const handleDifficultyChange = (val: string) => {
    const diff = ["easy", "medium", "hard"].includes(val) ? (val as DifficultyFilter) : "all";
    setDifficultyTab(diff);
    setPageGlobal(0);
    setPageMy(0);
  };

  const handleResetLeaderboard = async () => {
    try {
      await fetch("/api/leaderboard/reset", { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      if (walletAddress) {
        queryClient.invalidateQueries({
          queryKey: [`/api/leaderboard?walletAddress=${walletAddress}`],
        });
      }
    } catch {
      // ignore errors in test helper
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-carv-purple/10">
              <Trophy className="w-4 h-4 text-carv-purple" />
            </div>
            <CardTitle className="text-base">Leaderboard</CardTitle>
          </div>
          <button
            type="button"
            onClick={handleResetLeaderboard}
            className="text-[11px] text-muted-foreground hover:underline"
          >
            Reset (Test)
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="global" className="w-full" onValueChange={handleScopeChange}>
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="wallet" disabled={!walletAddress}>
              My Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-0">
            <DifficultyTabs
              difficulty={difficultyTab}
              onChange={handleDifficultyChange}
              entries={pageEntries}
              isLoading={isLoading}
              totalPages={totalPages}
              page={page}
              setPage={setPage}
              mintsByPuzzleId={mintsByPuzzleId}
              walletAddress={walletAddress}
            />
          </TabsContent>

          <TabsContent value="wallet" className="mt-0">
            <DifficultyTabs
              difficulty={difficultyTab}
              onChange={handleDifficultyChange}
              entries={pageEntries}
              isLoading={isLoading}
              totalPages={totalPages}
              page={page}
              setPage={setPage}
              mintsByPuzzleId={mintsByPuzzleId}
              walletAddress={walletAddress}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface DifficultyTabsProps {
  difficulty: DifficultyFilter;
  onChange: (val: string) => void;
  entries: LeaderboardEntry[];
  isLoading: boolean;
  totalPages: number;
  page: number;
  setPage: (p: number) => void;
  mintsByPuzzleId: Record<string, NftMint>;
  walletAddress: string | null;
}

function DifficultyTabs({
  difficulty,
  onChange,
  entries,
  isLoading,
  totalPages,
  page,
  setPage,
  mintsByPuzzleId,
  walletAddress,
}: DifficultyTabsProps) {
  return (
    <Tabs value={difficulty} onValueChange={onChange} className="w-full mt-1">
      <TabsList className="grid w-full grid-cols-4 mb-3">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="easy">Easy</TabsTrigger>
        <TabsTrigger value="medium">Medium</TabsTrigger>
        <TabsTrigger value="hard">Hard</TabsTrigger>
      </TabsList>

      <TabsContent value={difficulty} className="mt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No entries yet. Be the first!</p>
          </div>
        ) : (
          <>
            <div className="space-y-2" data-testid="list-leaderboard-entries">
              {entries.map((entry, index) => {
                const mint = mintsByPuzzleId[entry.id];
                const isMyEntry = walletAddress && entry.walletAddress === walletAddress;
                const explorerUrl =
                  mint && mint.txSignature
                    ? `https://explorer.testnet.carv.io/tx/${mint.txSignature}`
                    : null;

                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-3 rounded-md hover-elevate border"
                    data-testid={`row-leaderboard-${index}`}
                  >
                    <div className="flex items-center justify-center w-10">
                      {getRankIcon(page * PAGE_SIZE + index + 1)}
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
                    <div className="text-right text-xs">
                      <p className="font-mono font-semibold text-sm">{formatTime(entry.time)}</p>
                      <p className="text-muted-foreground">
                        {entry.completedAt ? new Date(entry.completedAt).toLocaleDateString() : ""}
                      </p>
                      {explorerUrl && isMyEntry && (
                        <button
                          type="button"
                          onClick={() => window.open(explorerUrl, "_blank")}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-carv-purple hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Mint
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage(Math.max(0, page - 1))}
                  className="disabled:opacity-50 hover:underline"
                >
                  Previous
                </button>
                <span>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  className="disabled:opacity-50 hover:underline"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

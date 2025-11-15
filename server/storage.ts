import type { 
  Puzzle, InsertPuzzle,
  LeaderboardEntry, InsertLeaderboardEntry,
  GameProgress, InsertGameProgress,
  NftMint, InsertNftMint
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle>;
  getPuzzle(id: string): Promise<Puzzle | undefined>;
  getPuzzleByDifficulty(difficulty: string): Promise<Puzzle | undefined>;
  
  createLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry>;
  getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  getLeaderboardByDifficulty(difficulty: string, limit?: number): Promise<LeaderboardEntry[]>;
  getLeaderboardByWallet(walletAddress: string, difficulty?: string, limit?: number): Promise<LeaderboardEntry[]>;
  
  saveGameProgress(progress: InsertGameProgress): Promise<GameProgress>;
  getGameProgress(walletAddress: string): Promise<GameProgress | undefined>;
  
  createNftMint(mint: InsertNftMint): Promise<NftMint>;
  getNftMintsByWallet(walletAddress: string): Promise<NftMint[]>;

  recordWallet(walletAddress: string): Promise<void>;
  getStats(): Promise<{ totalWallets: number; totalParticipants: number }>;

  getDailyPuzzle(dateKey: string, difficulty: string, slot?: number): Promise<Puzzle | undefined>;
  createDailyPuzzle(dateKey: string, puzzle: InsertPuzzle, slot?: number): Promise<Puzzle>;

  clearLeaderboard(): Promise<void>;
}

export class MemStorage implements IStorage {
  private puzzles: Map<string, Puzzle>;
  private leaderboard: Map<string, LeaderboardEntry>;
  private gameProgress: Map<string, GameProgress>;
  private nftMints: Map<string, NftMint>;
  private wallets: Set<string>;
  private dailyPuzzles: Map<string, Puzzle>;

  constructor() {
    this.puzzles = new Map();
    this.leaderboard = new Map();
    this.gameProgress = new Map();
    this.nftMints = new Map();
    this.wallets = new Set();
    this.dailyPuzzles = new Map();
  }

  async createPuzzle(insertPuzzle: InsertPuzzle): Promise<Puzzle> {
    const id = randomUUID();
    const puzzle: Puzzle = {
      ...insertPuzzle,
      id,
      createdAt: new Date(),
    };
    this.puzzles.set(id, puzzle);
    return puzzle;
  }

  async getPuzzle(id: string): Promise<Puzzle | undefined> {
    return this.puzzles.get(id);
  }

  async getPuzzleByDifficulty(difficulty: string): Promise<Puzzle | undefined> {
    return Array.from(this.puzzles.values()).find(
      (p) => p.difficulty === difficulty
    );
  }

  async createLeaderboardEntry(insertEntry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const id = randomUUID();
    const entry: LeaderboardEntry = {
      ...insertEntry,
      id,
      completedAt: new Date(),
    };
    this.leaderboard.set(id, entry);
    return entry;
  }

  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    const entries = Array.from(this.leaderboard.values());
    return entries.sort((a, b) => a.time - b.time).slice(0, limit);
  }

  async getLeaderboardByDifficulty(difficulty: string, limit: number = 100): Promise<LeaderboardEntry[]> {
    const entries = Array.from(this.leaderboard.values()).filter(
      (e) => e.difficulty === difficulty
    );
    return entries.sort((a, b) => a.time - b.time).slice(0, limit);
  }

  async getLeaderboardByWallet(
    walletAddress: string,
    difficulty?: string,
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const entries = Array.from(this.leaderboard.values()).filter((e) => {
      if (e.walletAddress !== walletAddress) return false;
      if (difficulty && e.difficulty !== difficulty) return false;
      return true;
    });
    return entries.sort((a, b) => a.time - b.time).slice(0, limit);
  }

  async saveGameProgress(insertProgress: InsertGameProgress): Promise<GameProgress> {
    const id = randomUUID();
    const progress: GameProgress = {
      ...insertProgress,
      id,
      updatedAt: new Date(),
    };
    
    if (insertProgress.walletAddress) {
      const existingKey = Array.from(this.gameProgress.entries()).find(
        ([_, p]) => p.walletAddress === insertProgress.walletAddress
      )?.[0];
      
      if (existingKey) {
        this.gameProgress.delete(existingKey);
      }
    }
    
    this.gameProgress.set(id, progress);
    return progress;
  }

  async getGameProgress(walletAddress: string): Promise<GameProgress | undefined> {
    return Array.from(this.gameProgress.values()).find(
      (p) => p.walletAddress === walletAddress
    );
  }

  async createNftMint(insertMint: InsertNftMint): Promise<NftMint> {
    const id = randomUUID();
    const mint: NftMint = {
      ...insertMint,
      id,
      mintedAt: new Date(),
    };
    this.nftMints.set(id, mint);
    return mint;
  }

  async getNftMintsByWallet(walletAddress: string): Promise<NftMint[]> {
    return Array.from(this.nftMints.values()).filter(
      (m) => m.walletAddress === walletAddress
    );
  }

  async recordWallet(walletAddress: string): Promise<void> {
    this.wallets.add(walletAddress);
  }

  async getStats(): Promise<{ totalWallets: number; totalParticipants: number }> {
    const totalWallets = this.wallets.size;
    const participantSet = new Set<string>();
    for (const mint of this.nftMints.values()) {
      participantSet.add(mint.walletAddress);
    }
    return {
      totalWallets,
      totalParticipants: participantSet.size,
    };
  }

  async getDailyPuzzle(dateKey: string, difficulty: string, slot: number = 0): Promise<Puzzle | undefined> {
    const key = `${dateKey}:${difficulty}:${slot}`;
    return this.dailyPuzzles.get(key);
  }

  async createDailyPuzzle(dateKey: string, insertPuzzle: InsertPuzzle, slot: number = 0): Promise<Puzzle> {
    const id = randomUUID();
    const puzzle: Puzzle = {
      ...insertPuzzle,
      id,
      createdAt: new Date(),
    };
    const key = `${dateKey}:${insertPuzzle.difficulty}:${slot}`;
    this.dailyPuzzles.set(key, puzzle);
    return puzzle;
  }

  async clearLeaderboard(): Promise<void> {
    this.leaderboard.clear();
  }
}

export const storage = new MemStorage();

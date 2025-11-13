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
  
  saveGameProgress(progress: InsertGameProgress): Promise<GameProgress>;
  getGameProgress(walletAddress: string): Promise<GameProgress | undefined>;
  
  createNftMint(mint: InsertNftMint): Promise<NftMint>;
  getNftMintsByWallet(walletAddress: string): Promise<NftMint[]>;
}

export class MemStorage implements IStorage {
  private puzzles: Map<string, Puzzle>;
  private leaderboard: Map<string, LeaderboardEntry>;
  private gameProgress: Map<string, GameProgress>;
  private nftMints: Map<string, NftMint>;

  constructor() {
    this.puzzles = new Map();
    this.leaderboard = new Map();
    this.gameProgress = new Map();
    this.nftMints = new Map();
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
}

export const storage = new MemStorage();

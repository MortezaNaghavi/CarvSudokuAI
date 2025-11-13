import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const puzzles = pgTable("puzzles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  difficulty: text("difficulty").notNull(),
  puzzle: text("puzzle").notNull(),
  solution: text("solution").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  time: integer("time").notNull(),
  difficulty: text("difficulty").notNull(),
  hintsUsed: integer("hints_used").notNull().default(0),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const gameProgress = pgTable("game_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address"),
  puzzleId: varchar("puzzle_id"),
  currentState: text("current_state").notNull(),
  timeElapsed: integer("time_elapsed").notNull().default(0),
  hintsUsed: integer("hints_used").notNull().default(0),
  mistakes: integer("mistakes").notNull().default(0),
  isComplete: boolean("is_complete").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nftMints = pgTable("nft_mints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  puzzleId: varchar("puzzle_id").notNull(),
  txSignature: text("tx_signature"),
  mintedAt: timestamp("minted_at").defaultNow(),
});

export const insertPuzzleSchema = createInsertSchema(puzzles).omit({ id: true, createdAt: true });
export const insertLeaderboardEntrySchema = createInsertSchema(leaderboardEntries).omit({ id: true, completedAt: true });
export const insertGameProgressSchema = createInsertSchema(gameProgress).omit({ id: true, updatedAt: true });
export const insertNftMintSchema = createInsertSchema(nftMints).omit({ id: true, mintedAt: true });

export type Puzzle = typeof puzzles.$inferSelect;
export type InsertPuzzle = z.infer<typeof insertPuzzleSchema>;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardEntrySchema>;
export type GameProgress = typeof gameProgress.$inferSelect;
export type InsertGameProgress = z.infer<typeof insertGameProgressSchema>;
export type NftMint = typeof nftMints.$inferSelect;
export type InsertNftMint = z.infer<typeof insertNftMintSchema>;

export type SudokuCell = {
  value: number;
  isGiven: boolean;
  isError: boolean;
  notes: number[];
};

export type SudokuGrid = SudokuCell[][];

export type GameState = {
  grid: SudokuGrid;
  selectedCell: { row: number; col: number } | null;
  timeElapsed: number;
  mistakes: number;
  hintsUsed: number;
  isComplete: boolean;
  difficulty: string;
};

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertPuzzleSchema, insertLeaderboardEntrySchema, insertGameProgressSchema, insertNftMintSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/puzzles/generate", async (req, res) => {
    try {
      const { difficulty } = req.body;
      
      if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({ error: "Invalid difficulty level" });
      }

      const existingPuzzle = await storage.getPuzzleByDifficulty(difficulty);
      if (existingPuzzle) {
        return res.json(existingPuzzle);
      }

      const { generateSudokuPuzzle, gridToString } = await import('../client/src/lib/sudoku');
      const { puzzle, solution } = generateSudokuPuzzle(difficulty as any);
      
      const puzzleData = {
        difficulty,
        puzzle: gridToString(puzzle),
        solution: gridToString(solution),
      };

      const validated = insertPuzzleSchema.parse(puzzleData);
      const created = await storage.createPuzzle(validated);
      
      res.json(created);
    } catch (error: any) {
      console.error('Puzzle generation error:', error);
      res.status(500).json({ error: error.message || "Failed to generate puzzle" });
    }
  });

  app.post("/api/puzzles/validate", async (req, res) => {
    try {
      const { puzzleId, solution: userSolution } = req.body;
      
      const puzzle = await storage.getPuzzle(puzzleId);
      if (!puzzle) {
        return res.status(404).json({ error: "Puzzle not found" });
      }

      const isValid = puzzle.solution === userSolution;
      
      res.json({ 
        valid: isValid,
        message: isValid ? "Puzzle solved correctly!" : "Solution is incorrect"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to validate puzzle" });
    }
  });

  app.post("/api/hints/generate", async (req, res) => {
    try {
      const { grid, row, col, solution } = req.body;
      
      if (!grid || row === undefined || col === undefined || !solution) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const { getHintsForCell } = await import('../client/src/lib/sudoku');
      const hints = getHintsForCell(grid, row, col, solution);
      
      res.json({ 
        hints,
        message: `CARV AI suggests: ${hints.join(', ')}`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate hint" });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const { difficulty, limit } = req.query;
      
      let entries;
      if (difficulty && typeof difficulty === 'string') {
        entries = await storage.getLeaderboardByDifficulty(difficulty, limit ? parseInt(limit as string) : 100);
      } else {
        entries = await storage.getLeaderboard(limit ? parseInt(limit as string) : 100);
      }
      
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/leaderboard", async (req, res) => {
    try {
      const validated = insertLeaderboardEntrySchema.parse(req.body);
      const entry = await storage.createLeaderboardEntry(validated);
      
      res.json(entry);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid leaderboard entry data", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create leaderboard entry" });
    }
  });

  app.post("/api/game-progress", async (req, res) => {
    try {
      const validated = insertGameProgressSchema.parse(req.body);
      const progress = await storage.saveGameProgress(validated);
      
      res.json(progress);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid game progress data", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to save game progress" });
    }
  });

  app.get("/api/game-progress/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const progress = await storage.getGameProgress(walletAddress);
      
      if (!progress) {
        return res.status(404).json({ error: "No saved progress found" });
      }
      
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch game progress" });
    }
  });

  app.post("/api/nft/mint", async (req, res) => {
    try {
      const validated = insertNftMintSchema.parse(req.body);
      const mint = await storage.createNftMint(validated);
      
      res.json({ 
        success: true,
        mint,
        message: "Sudoku Soul NFT minted successfully on CARV Testnet"
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid NFT mint data", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to mint NFT" });
    }
  });

  app.get("/api/nft/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const mints = await storage.getNftMintsByWallet(walletAddress);
      
      res.json(mints);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch NFT mints" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

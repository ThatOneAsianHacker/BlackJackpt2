import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameStatsSchema, insertGameSessionSchema, type GameState } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Game statistics routes
  app.get("/api/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await storage.getGameStats(userId);
      
      if (!stats) {
        return res.status(404).json({ message: "Stats not found" });
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  app.patch("/api/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const statsUpdate = insertGameStatsSchema.partial().parse(req.body);
      
      const updatedStats = await storage.updateGameStats(userId, statsUpdate);
      res.json(updatedStats);
    } catch (error) {
      res.status(400).json({ message: "Invalid stats data" });
    }
  });

  // Game session routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertGameSessionSchema.parse(req.body);
      const session = await storage.saveGameSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  app.get("/api/sessions/:userId/latest", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const session = await storage.getLatestGameSession(userId);
      
      if (!session) {
        return res.status(404).json({ message: "No sessions found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to get session" });
    }
  });

  // Initialize demo user for the game
  app.post("/api/init-demo", async (req, res) => {
    try {
      // Check if demo user already exists
      const existingUser = await storage.getUserByUsername("demo");
      
      if (existingUser) {
        const stats = await storage.getGameStats(existingUser.id);
        return res.json({ user: existingUser, stats });
      }

      // Create demo user
      const user = await storage.createUser({
        username: "demo",
        password: "demo"
      });

      const stats = await storage.getGameStats(user.id);
      res.json({ user, stats });
    } catch (error) {
      res.status(500).json({ message: "Failed to initialize demo user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

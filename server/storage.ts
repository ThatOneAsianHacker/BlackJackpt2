import { users, gameStats, gameSessions, type User, type InsertUser, type GameStats, type InsertGameStats, type GameSession, type InsertGameSession } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getGameStats(userId: number): Promise<GameStats | undefined>;
  updateGameStats(userId: number, stats: Partial<InsertGameStats>): Promise<GameStats>;
  
  saveGameSession(session: InsertGameSession): Promise<GameSession>;
  getLatestGameSession(userId: number): Promise<GameSession | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    
    // Initialize game stats for new user
    await db
      .insert(gameStats)
      .values({
        userId: user.id,
        totalHands: 0,
        handsWon: 0,
        blackjacks: 0,
        busts: 0,
        netProfit: 0,
        balance: 1000,
      });
    
    return user;
  }

  async getGameStats(userId: number): Promise<GameStats | undefined> {
    const [stats] = await db.select().from(gameStats).where(eq(gameStats.userId, userId));
    return stats || undefined;
  }

  async updateGameStats(userId: number, statsUpdate: Partial<InsertGameStats>): Promise<GameStats> {
    const existingStats = await this.getGameStats(userId);
    
    if (!existingStats) {
      const [newStats] = await db
        .insert(gameStats)
        .values({
          userId,
          totalHands: 0,
          handsWon: 0,
          blackjacks: 0,
          busts: 0,
          netProfit: 0,
          balance: 1000,
          ...statsUpdate,
        })
        .returning();
      return newStats;
    }

    const [updatedStats] = await db
      .update(gameStats)
      .set({
        ...statsUpdate,
        updatedAt: new Date(),
      })
      .where(eq(gameStats.userId, userId))
      .returning();
    
    return updatedStats;
  }

  async saveGameSession(session: InsertGameSession): Promise<GameSession> {
    const [gameSession] = await db
      .insert(gameSessions)
      .values(session)
      .returning();
    return gameSession;
  }

  async getLatestGameSession(userId: number): Promise<GameSession | undefined> {
    const [session] = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.userId, userId))
      .orderBy(gameSessions.createdAt)
      .limit(1);
    return session || undefined;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameStats: Map<number, GameStats>;
  private gameSessions: Map<number, GameSession[]>;
  private currentUserId: number;
  private currentGameStatsId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.gameStats = new Map();
    this.gameSessions = new Map();
    this.currentUserId = 1;
    this.currentGameStatsId = 1;
    this.currentSessionId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    
    // Initialize game stats for new user
    const statsId = this.currentGameStatsId++;
    const stats: GameStats = {
      id: statsId,
      userId: id,
      totalHands: 0,
      handsWon: 0,
      blackjacks: 0,
      busts: 0,
      netProfit: 0,
      balance: 1000,
      updatedAt: new Date(),
    };
    this.gameStats.set(id, stats);
    
    return user;
  }

  async getGameStats(userId: number): Promise<GameStats | undefined> {
    return this.gameStats.get(userId);
  }

  async updateGameStats(userId: number, statsUpdate: Partial<InsertGameStats>): Promise<GameStats> {
    const existingStats = this.gameStats.get(userId);
    if (!existingStats) {
      const newStats: GameStats = {
        id: this.currentGameStatsId++,
        userId,
        totalHands: 0,
        handsWon: 0,
        blackjacks: 0,
        busts: 0,
        netProfit: 0,
        balance: 1000,
        updatedAt: new Date(),
        ...statsUpdate,
      };
      this.gameStats.set(userId, newStats);
      return newStats;
    }

    const updatedStats: GameStats = {
      ...existingStats,
      ...statsUpdate,
      updatedAt: new Date(),
    };
    this.gameStats.set(userId, updatedStats);
    return updatedStats;
  }

  async saveGameSession(session: InsertGameSession): Promise<GameSession> {
    const id = this.currentSessionId++;
    const now = new Date();
    const gameSession: GameSession = {
      ...session,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const userSessions = this.gameSessions.get(session.userId!) || [];
    userSessions.push(gameSession);
    this.gameSessions.set(session.userId!, userSessions);

    return gameSession;
  }

  async getLatestGameSession(userId: number): Promise<GameSession | undefined> {
    const userSessions = this.gameSessions.get(userId) || [];
    return userSessions[userSessions.length - 1];
  }
}

export const storage = new DatabaseStorage();

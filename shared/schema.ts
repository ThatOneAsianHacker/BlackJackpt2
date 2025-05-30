import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const gameStats = pgTable("game_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  totalHands: integer("total_hands").notNull().default(0),
  handsWon: integer("hands_won").notNull().default(0),
  blackjacks: integer("blackjacks").notNull().default(0),
  busts: integer("busts").notNull().default(0),
  netProfit: integer("net_profit").notNull().default(0),
  balance: integer("balance").notNull().default(1000),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  gameState: jsonb("game_state").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameStatsSchema = createInsertSchema(gameStats).omit({
  id: true,
  updatedAt: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type GameStats = typeof gameStats.$inferSelect;
export type InsertGameStats = z.infer<typeof insertGameStatsSchema>;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

// Game state types
export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'jack' | 'queen' | 'king' | 'ace';
  id: string;
}

export interface Hand {
  cards: Card[];
  value: number;
  isBlackjack: boolean;
  isBust: boolean;
}

export interface GameState {
  deck: Card[];
  playerHand: Hand;
  dealerHand: Hand;
  currentBet: number;
  balance: number;
  gamePhase: 'betting' | 'dealing' | 'playing' | 'dealer_turn' | 'finished';
  canDoubleDown: boolean;
  canSplit: boolean;
  cardCount: {
    running: number;
    true: number;
    decksRemaining: number;
  };
  numDecks: number;
  gameResult?: 'win' | 'lose' | 'push' | 'blackjack';
}

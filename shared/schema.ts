import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  heading: text("heading").notNull(),
  content: text("content").notNull(),
  newsType: text("news_type").notNull(),
  // Storing simple metadata, embeddings will be in-memory for speed
});

export const insertArticleSchema = createInsertSchema(articles).omit({ id: true });

export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export interface ArticleWithScore extends Article {
  score: number;
}

export interface SearchResponse {
  results: ArticleWithScore[];
  query: string;
}

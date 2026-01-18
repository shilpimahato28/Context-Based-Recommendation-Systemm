import { db } from "./db";
import { articles, type Article, type InsertArticle } from "@shared/schema";

export interface IStorage {
  getAllArticles(): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  bulkCreateArticles(articlesList: InsertArticle[]): Promise<Article[]>;
}

export class DatabaseStorage implements IStorage {
  async getAllArticles(): Promise<Article[]> {
    return await db.select().from(articles);
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const [article] = await db
      .insert(articles)
      .values(insertArticle)
      .returning();
    return article;
  }

  async bulkCreateArticles(articlesList: InsertArticle[]): Promise<Article[]> {
    if (articlesList.length === 0) return [];
    return await db
      .insert(articles)
      .values(articlesList)
      .returning();
  }
}

export const storage = new DatabaseStorage();

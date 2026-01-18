import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { pipeline, env } from "@xenova/transformers";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";

// Configure local cache for models to avoid re-downloading
env.cacheDir = "./.cache";

// AI Service Class
class ContentRecommender {
  private model: any = null;
  private embeddings: Float32Array[] = [];
  private articleIds: number[] = [];
  private isReady = false;

  // Text cleaning and normalization
  private cleanText(text: string): string {
    if (!text) return "";
    
    // Normalize whitespace - replace multiple spaces/newlines with single space
    text = text.replace(/\s+/g, " ");
    
    // Remove or replace special characters that might interfere
    // Keep essential punctuation but normalize
    text = text.replace(/[""'']/g, '"'); // Normalize quotes
    text = text.replace(/[–—]/g, "-"); // Normalize dashes
    text = text.replace(/…/g, "..."); // Normalize ellipsis
    
    // Remove excessive punctuation
    text = text.replace(/[.]{3,}/g, "..."); // Multiple dots to ellipsis
    text = text.replace(/[!]{2,}/g, "!"); // Multiple exclamations
    text = text.replace(/[?]{2,}/g, "?"); // Multiple questions
    
    // Trim and return
    return text.trim();
  }

  // Intelligently extract relevant content
  private prepareArticleText(article: { heading: string; content: string; newsType: string }): string {
    // Clean heading
    const cleanHeading = this.cleanText(article.heading);
    
    // Clean and extract more content (use first 600 chars instead of 200)
    // Look for sentence boundaries to avoid cutting mid-sentence
    let content = this.cleanText(article.content);
    
    // Extract up to 600 characters, but try to end at a sentence boundary
    if (content.length > 600) {
      const truncated = content.slice(0, 600);
      // Find last sentence ending (., !, or ?) before limit
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf(". "),
        truncated.lastIndexOf("! "),
        truncated.lastIndexOf("? ")
      );
      
      if (lastSentenceEnd > 300) {
        // Use sentence boundary if it's not too early
        content = truncated.slice(0, lastSentenceEnd + 1);
      } else {
        // Otherwise just use the truncated text
        content = truncated;
      }
    }
    
    // Combine heading (appears twice for emphasis) + content + newsType for better context
    // Heading appears at start and in context to give it more weight
    return `${cleanHeading}. ${content} [Category: ${article.newsType}]`;
  }

  async initialize() {
    console.log("Initializing AI Model...");
    // Load the model (quantized for speed/CPU)
    this.model = await pipeline("feature-extraction", "Xenova/paraphrase-MiniLM-L6-v2");
    console.log("AI Model loaded.");
    await this.refreshEmbeddings();
    this.isReady = true;
  }

  async refreshEmbeddings() {
    console.log("Computing embeddings for articles...");
    const articles = await storage.getAllArticles();
    this.embeddings = [];
    this.articleIds = [];

    // Process in batches to avoid blocking too long
    for (const article of articles) {
      // Use improved text preparation with cleaning and more content
      const text = this.prepareArticleText(article);
      const output = await this.model(text, { pooling: "mean", normalize: true });
      this.embeddings.push(output.data);
      this.articleIds.push(article.id);
    }
    console.log(`Computed embeddings for ${this.embeddings.length} articles.`);
  }

  async search(query: string, limit: number = 10) {
    if (!this.isReady) throw new Error("AI Service not ready");

    // Clean and normalize the query before encoding
    const cleanedQuery = this.cleanText(query);
    const queryOutput = await this.model(cleanedQuery, { pooling: "mean", normalize: true });
    const queryEmbedding = queryOutput.data;

    // Calculate Cosine Similarity
    const scores = this.embeddings.map((emb, idx) => ({
      id: this.articleIds[idx],
      score: this.cosineSimilarity(queryEmbedding, emb)
    }));

    // Sort and slice
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

const recommender = new ContentRecommender();

// CSV Seeding Function
async function seedFromCSV() {
  const existing = await storage.getAllArticles();
  if (existing.length > 0) {
    console.log("Database already seeded.");
    return;
  }

  const csvPath = path.join(process.cwd(), "attached_assets", "Articles_1768679108591.csv");
  if (!fs.existsSync(csvPath)) {
    console.warn("CSV file not found:", csvPath);
    // Fallback seed
    await storage.createArticle({
        heading: "Asian market upswing",
        content: "Asian markets showed strong growth today led by tech sector...",
        newsType: "Business"
    });
    return;
  }

  console.log("Seeding from CSV...");
  const records: any[] = [];
  
  // Create a read stream that handles Latin-1 (mostly)
  // We'll try to read it as raw buffer and decode
  try {
      const content = fs.readFileSync(csvPath, 'latin1'); // As per user hint
      
      const parser = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      for await (const record of parser) {
        // Map CSV columns to Schema
        // Expecting 'Article', 'Heading', 'NewsType' based on user snippet
        if (record.Heading && record.Article && record.NewsType) {
             records.push({
                heading: record.Heading,
                content: record.Article,
                newsType: record.NewsType
             });
        }
      }

      // Bulk insert (limit to 100 for speed/demo if massive, but let's try all)
      // If records > 500, lets just take 500 for the demo to be fast
      const limitedRecords = records.slice(0, 500);
      await storage.bulkCreateArticles(limitedRecords);
      console.log(`Seeded ${limitedRecords.length} articles.`);

  } catch (err) {
      console.error("Error seeding CSV:", err);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Seed and Init AI in background
  seedFromCSV().then(() => recommender.initialize());

  app.get(api.articles.list.path, async (req, res) => {
    const articles = await storage.getAllArticles();
    res.json(articles.slice(0, 50)); // Limit for listing
  });

  app.get(api.articles.search.path, async (req, res) => {
    try {
      const { q, limit } = api.articles.search.input.parse(req.query);
      
      const results = await recommender.search(q, limit);
      
      // Hydrate with full article data
      const allArticles = await storage.getAllArticles();
      const hydratedResults = results.map(r => {
        const article = allArticles.find(a => a.id === r.id);
        return article ? { ...article, score: r.score } : null;
      }).filter(Boolean);

      res.json({ results: hydratedResults, query: q });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Search failed" });
    }
  });

  return httpServer;
}

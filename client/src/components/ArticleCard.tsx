import { Badge } from "@/components/Badge";
import { type ArticleWithScore } from "@shared/schema";
import { motion } from "framer-motion";
import { ExternalLink, Percent } from "lucide-react";

interface ArticleCardProps {
  article: ArticleWithScore;
  index: number;
}

export function ArticleCard({ article, index }: ArticleCardProps) {
  const percentage = article.score ? Math.round(article.score * 100) : 0;
  
  // Truncate content for preview
  const preview = article.content.length > 200 
    ? article.content.substring(0, 200) + "..." 
    : article.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative flex flex-col h-full bg-card rounded-xl border border-border/60 p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <Badge variant="category" className="uppercase tracking-wide text-[10px]">
          {article.newsType}
        </Badge>
        {percentage > 0 && (
          <div className="flex items-center gap-1 text-sm font-semibold text-primary" title="Similarity Score">
            <Percent className="w-3 h-3" />
            <span>{percentage}% Match</span>
          </div>
        )}
      </div>

      <h3 className="text-xl font-display font-bold leading-tight text-foreground group-hover:text-primary transition-colors duration-200 mb-3">
        {article.heading}
      </h3>

      <p className="text-muted-foreground text-sm leading-relaxed flex-grow">
        {preview}
      </p>

      <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Article #{article.id}</span>
        <button className="text-sm font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-x-[-10px] group-hover:translate-x-0">
          Read Full Article <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 h-[300px] animate-pulse">
      <div className="h-5 w-20 bg-muted rounded-full mb-4" />
      <div className="h-8 w-3/4 bg-muted rounded mb-2" />
      <div className="h-8 w-1/2 bg-muted rounded mb-6" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-5/6 bg-muted rounded" />
      </div>
    </div>
  );
}

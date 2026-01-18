import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ArticleCard, ArticleCardSkeleton } from "@/components/ArticleCard";
import { useArticles, useSearchArticles } from "@/hooks/use-articles";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper } from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const { 
    data: articles, 
    isLoading: isArticlesLoading 
  } = useArticles();

  const { 
    data: searchResults, 
    isLoading: isSearchLoading,
    isFetching: isSearchFetching
  } = useSearchArticles(activeQuery);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveQuery("");
  };

  // Determine what to show
  const isSearching = !!activeQuery;
  const showResults = isSearching && searchResults;
  const isLoading = isSearching ? isSearchLoading || isSearchFetching : isArticlesLoading;
  const currentData = isSearching 
    ? searchResults?.results 
    : articles?.map(a => ({ ...a, score: 0 })); // Add dummy score for type compatibility

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Hero Section */}
      <header className="relative bg-white border-b border-border/40 pb-16 pt-24 px-4 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Newspaper className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
              News<span className="text-primary">Rec</span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
          >
            An intelligent recommendation engine powered by Sentence-BERT embeddings.
            Discover content that truly matches your interests.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <SearchBar 
              onSearch={handleSearch} 
              isSearching={isSearchFetching}
              initialQuery={searchQuery}
            />
          </motion.div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            {isSearching ? (
              <>
                Search Results for <span className="text-primary">"{activeQuery}"</span>
              </>
            ) : (
              "Latest Articles"
            )}
          </h2>

          {isSearching && (
            <button 
              onClick={clearSearch}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            <AnimatePresence mode="popLayout">
              {currentData && currentData.length > 0 ? (
                currentData.map((article, idx) => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    index={idx} 
                  />
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 text-center"
                >
                  <p className="text-xl text-muted-foreground font-medium">No articles found.</p>
                  <p className="text-muted-foreground/60 mt-2">Try adjusting your search terms.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

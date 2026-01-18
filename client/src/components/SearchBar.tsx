import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSearchArticles } from "@/hooks/use-articles";

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  isSearching?: boolean;
}

// Predefined suggestions for autocomplete
const SUGGESTIONS = [
  "Asian markets",
  "Technology trends",
  "Climate change policy",
  "Oil prices",
  "Stock market",
  "Business news",
  "Economic policy",
  "International relations",
  "Sports news",
  "Health and science",
];

export function SearchBar({ onSearch, initialQuery = "", isSearching = false }: SearchBarProps) {
  const [value, setValue] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get search suggestions using the search API with a debounced query
  const debouncedQuery = value.trim().length >= 2 ? value.trim() : "";
  const { data: searchResults } = useSearchArticles(debouncedQuery);

  // Filter suggestions based on input
  const filteredSuggestions = value.trim()
    ? SUGGESTIONS.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
    : SUGGESTIONS.slice(0, 5);

  // Use search results as additional suggestions if available
  const resultSuggestions = searchResults?.results
    ?.slice(0, 3)
    .map(article => article.heading)
    .filter((heading): heading is string => heading.length > 0) || [];

  const allSuggestions = [
    ...filteredSuggestions,
    ...resultSuggestions.filter(h => 
      !filteredSuggestions.some(s => s.toLowerCase() === h.toLowerCase())
    )
  ].slice(0, 8);

  useEffect(() => {
    if (initialQuery !== value) {
      setValue(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    const hasSuggestions = allSuggestions.length > 0;
    setShowSuggestions(value.trim().length > 0 && hasSuggestions);
    setHighlightedIndex(-1);
  }, [value, allSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || allSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < allSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(allSuggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors duration-200">
          <Search className="h-6 w-6" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => value.trim() && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me to recommend news about..."
          className="block w-full pl-12 pr-4 py-4 rounded-full border-2 border-border/60 bg-white/50 backdrop-blur-sm text-lg shadow-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300"
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <button
            type="submit"
            disabled={!value.trim() || isSearching}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && allSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border-2 border-border/60 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="py-2 max-h-80 overflow-y-auto">
              {allSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors ${
                    highlightedIndex === index ? "bg-primary/10" : ""
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Search suggestions/examples (static for now) */}
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
        <span>Try searching:</span>
        <button 
          type="button" 
          onClick={() => { setValue("Asian markets"); onSearch("Asian markets"); }}
          className="hover:text-primary hover:underline"
        >
          "Asian markets"
        </button>
        <span className="opacity-50">•</span>
        <button 
          type="button" 
          onClick={() => { setValue("Technology trends"); onSearch("Technology trends"); }}
          className="hover:text-primary hover:underline"
        >
          "Technology trends"
        </button>
        <span className="opacity-50">•</span>
        <button 
          type="button" 
          onClick={() => { setValue("Climate change policy"); onSearch("Climate change policy"); }}
          className="hover:text-primary hover:underline"
        >
          "Climate change policy"
        </button>
      </div>
    </form>
  );
}

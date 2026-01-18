import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useArticles(limit = 20, offset = 0) {
  return useQuery({
    queryKey: [api.articles.list.path, limit, offset],
    queryFn: async () => {
      const url = buildUrl(api.articles.list.path) + `?limit=${limit}&offset=${offset}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch articles");
      return api.articles.list.responses[200].parse(await res.json());
    },
  });
}

export function useSearchArticles(query: string) {
  return useQuery({
    queryKey: [api.articles.search.path, query],
    queryFn: async () => {
      if (!query.trim()) return null;
      
      const url = buildUrl(api.articles.search.path) + `?q=${encodeURIComponent(query)}&limit=12`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      return api.articles.search.responses[200].parse(await res.json());
    },
    enabled: !!query.trim(), // Only fetch if query exists
  });
}

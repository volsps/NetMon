import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { SiteWithDetails } from "@shared/schema";

// Helper to handle Zod parsing errors gracefully (though usually we want to throw)
async function parseResponse<T>(schema: { parse: (data: unknown) => T }, data: unknown): Promise<T> {
  return schema.parse(data);
}

// GET /api/sites
export function useSites() {
  return useQuery({
    queryKey: [api.sites.list.path],
    queryFn: async () => {
      const res = await fetch(api.sites.list.path);
      if (!res.ok) throw new Error("Failed to fetch sites");
      const data = await res.json();
      return parseResponse(api.sites.list.responses[200], data);
    },
  });
}

// GET /api/sites/:id
export function useSite(id: number | null) {
  return useQuery({
    queryKey: [api.sites.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.sites.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch site details");
      const data = await res.json();
      // Cast the response to our frontend type which includes the relations
      return parseResponse(api.sites.get.responses[200], data) as unknown as SiteWithDetails;
    },
    enabled: !!id,
  });
}

// GET /api/search?q=...
export function useSearch(query: string) {
  return useQuery({
    queryKey: [api.search.global.path, query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const url = `${api.search.global.path}?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      return parseResponse(api.search.global.responses[200], data);
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60, // Cache search results for a bit
  });
}

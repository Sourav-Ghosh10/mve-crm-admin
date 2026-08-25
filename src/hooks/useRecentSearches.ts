import { useLocalStorage } from "./useLocalStorage";
import { useCallback } from "react";

export function useRecentSearches(searchKey: string) {
    const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(
        `recent_searches_${searchKey}`,
        []
    );

    const addSearch = useCallback((query: string) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        setRecentSearches((prev) => {
            // Remove existing instance of the same query to move it to the top
            const filtered = prev.filter((q) => q !== trimmedQuery);
            // Add to front and limit to 20
            return [trimmedQuery, ...filtered].slice(0, 20);
        });
    }, [setRecentSearches]);

    const clearSearches = useCallback(() => {
        setRecentSearches([]);
    }, [setRecentSearches]);

    const removeSearch = useCallback((query: string) => {
        setRecentSearches((prev) => prev.filter((q) => q !== query));
    }, [setRecentSearches]);

    return {
        recentSearches,
        addSearch,
        clearSearches,
        removeSearch
    };
}

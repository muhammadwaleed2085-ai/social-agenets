'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mediaStudioApi } from '@/lib/python-backend';

// Types
export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  source: string;
  url: string;
  thumbnail_url?: string;
  prompt: string;
  model: string;
  config: Record<string, any>;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
}

interface MediaFilters {
  type?: 'image' | 'video' | 'audio';
  isFavorite?: boolean;
  search?: string;
}

interface MediaContextType {
  mediaItems: MediaItem[];
  loading: boolean;
  filters: MediaFilters;
  totalItems: number;
  hasMore: boolean;
  pageSize: number;
  setFilters: (filters: MediaFilters) => void;
  refreshMedia: () => Promise<void>;
  loadMore: () => Promise<void>;
  toggleFavorite: (itemId: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  addItem: (item: MediaItem) => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const { user, workspaceId } = useAuth();

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFiltersState] = useState<MediaFilters>({});
  const [totalItems, setTotalItems] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 20;

  // Refs for tracking data load status (like DashboardContext)
  const dataLoadedRef = useRef(false);
  const currentWorkspaceRef = useRef<string | null>(null);

  // Load media from Python backend
  const loadMedia = useCallback(async ({ force = false, append = false, nextOffset = 0 }: { force?: boolean; append?: boolean; nextOffset?: number } = {}) => {
    if (!user || !workspaceId) {
      return;
    }

    // Only load data once per workspace unless forced (same pattern as DashboardContext)
    if (!force && !append && dataLoadedRef.current && currentWorkspaceRef.current === workspaceId) {
      return;
    }

    try {
      // Only show loading spinner on manual refresh, not initial load
      if (force || append) {
        setLoading(true);
      }

      // Use Python backend API
      const response = await mediaStudioApi.getMediaLibrary(workspaceId, {
        type: filters.type,
        is_favorite: filters.isFavorite,
        search: filters.search,
        limit: pageSize,
        offset: nextOffset,
      });

      // Map response to MediaItem format
      const items = (response.items || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        source: item.source,
        url: item.file_url || item.url,
        thumbnail_url: item.thumbnail_url,
        prompt: item.prompt || '',
        model: item.model || '',
        config: item.config || {},
        is_favorite: item.is_favorite || false,
        tags: item.tags || [],
        created_at: item.created_at,
      })) as MediaItem[];

      setMediaItems(prevItems => {
        if (!append) {
          return items;
        }

        const existingIds = new Set(prevItems.map(item => item.id));
        const newItems = items.filter(item => !existingIds.has(item.id));
        return [...prevItems, ...newItems];
      });
      setTotalItems(response.total || items.length);
      const updatedOffset = nextOffset + items.length;
      setOffset(updatedOffset);
      setHasMore(updatedOffset < (response.total || items.length));

      if (!append) {
        dataLoadedRef.current = true;
        currentWorkspaceRef.current = workspaceId;
      }
    } catch (error: any) {
      console.error('Failed to load media:', error);
    } finally {
      if (force || append) {
        setLoading(false);
      }
    }
  }, [user, workspaceId, filters, pageSize]);

  // Initial load
  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Set filters and reload with new filters
  const setFilters = useCallback((newFilters: MediaFilters) => {
    setFiltersState(newFilters);
    setMediaItems([]);
    setTotalItems(0);
    setOffset(0);
    setHasMore(false);
    // Reset data loaded flag when filters change to allow reload
    dataLoadedRef.current = false;
  }, []);

  const loadMore = useCallback(async () => {
    if (!workspaceId || loading || !hasMore) return;
    await loadMedia({ force: true, append: true, nextOffset: offset });
  }, [workspaceId, loading, hasMore, loadMedia, offset]);

  // Toggle favorite using Python backend
  const toggleFavorite = useCallback(async (itemId: string) => {
    if (!workspaceId) return;

    const item = mediaItems.find(i => i.id === itemId);
    if (!item) return;

    // Optimistic update
    setMediaItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, is_favorite: !i.is_favorite } : i)
    );

    try {
      await mediaStudioApi.toggleFavorite(workspaceId, itemId, !item.is_favorite);
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      // Revert on error
      setMediaItems(prev =>
        prev.map(i => i.id === itemId ? { ...i, is_favorite: item.is_favorite } : i)
      );
    }
  }, [workspaceId, mediaItems]);

  // Delete item using Python backend
  const deleteItem = useCallback(async (itemId: string) => {
    if (!workspaceId) return;

    const itemToDelete = mediaItems.find(i => i.id === itemId);

    // Optimistic update
    setMediaItems(prev => prev.filter(i => i.id !== itemId));
    setTotalItems(prev => prev - 1);

    try {
      await mediaStudioApi.deleteMediaItem(workspaceId, itemId);
    } catch (error: any) {
      console.error('Failed to delete media item:', error);
      if (itemToDelete) {
        // Revert on error
        setMediaItems(prev => [itemToDelete, ...prev]);
        setTotalItems(prev => prev + 1);
      }
    }
  }, [workspaceId, mediaItems]);

  // Add new item (used after upload or generation)
  const addItem = useCallback((item: MediaItem) => {
    setMediaItems(prev => [item, ...prev]);
    setTotalItems(prev => prev + 1);
  }, []);

  const value = useMemo(() => ({
    mediaItems,
    loading,
    filters,
    totalItems,
    hasMore,
    pageSize,
    setFilters,
    refreshMedia: () => loadMedia({ force: true, append: false, nextOffset: 0 }),
    loadMore,
    toggleFavorite,
    deleteItem,
    addItem,
  }), [
    mediaItems, loading, filters, totalItems,
    hasMore, pageSize, setFilters, loadMedia, loadMore, toggleFavorite, deleteItem, addItem
  ]);

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
}

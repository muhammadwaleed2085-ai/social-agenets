/**
 * useChatHistory Hook
 * 
 * Manages chat thread history: fetch, delete, rename, search.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ThreadService, ContentThread } from '@/services/database/threadService.client';

export const useChatHistory = (isHistoryVisible: boolean, workspaceId: string | null) => {
    const [chatHistory, setChatHistory] = useState<ContentThread[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const hasLoadedHistory = useRef(false);

    // Load chat history lazily when history panel is opened
    useEffect(() => {
        if (!isHistoryVisible || hasLoadedHistory.current || !workspaceId) return;

        const loadChatHistory = async () => {
            hasLoadedHistory.current = true;
            setIsLoadingHistory(true);
            try {
                const result = await ThreadService.getAllThreads(workspaceId, 100, 0);
                setChatHistory(result.items);
            } catch (e) {
                console.error('Failed to load chat history:', e);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        loadChatHistory();
    }, [isHistoryVisible, workspaceId]);

    // Refresh history when workspace changes
    useEffect(() => {
        if (workspaceId) {
            hasLoadedHistory.current = false;
        }
    }, [workspaceId]);

    // Delete a thread
    const deleteThread = useCallback(async (threadId: string) => {
        if (!workspaceId) return;

        try {
            await ThreadService.deleteThread(threadId, workspaceId);
            setChatHistory(prev => prev.filter(t => t.id !== threadId));
        } catch (e) {
            console.error('Failed to delete thread:', e);
            throw e;
        }
    }, [workspaceId]);

    // Rename a thread (update local state after API call is made elsewhere)
    const renameThread = useCallback((threadId: string, newTitle: string) => {
        setChatHistory(prev =>
            prev.map(t =>
                t.id === threadId
                    ? { ...t, title: newTitle, updated_at: new Date().toISOString() }
                    : t
            )
        );
    }, []);

    // Add a new thread to the top of the list
    const addThread = useCallback((thread: ContentThread) => {
        setChatHistory(prev => [thread, ...prev]);
    }, []);

    // Update thread in the list
    const updateThread = useCallback((threadId: string, updates: Partial<ContentThread>) => {
        setChatHistory(prev =>
            prev.map(t =>
                t.id === threadId
                    ? { ...t, ...updates, updated_at: new Date().toISOString() }
                    : t
            )
        );
    }, []);

    // Search threads locally
    const searchThreads = useCallback((query: string): ContentThread[] => {
        if (!query.trim()) return chatHistory;
        const lowerQuery = query.toLowerCase();
        return chatHistory.filter(t =>
            t.title.toLowerCase().includes(lowerQuery)
        );
    }, [chatHistory]);

    // Refresh the history list
    const refreshHistory = useCallback(async () => {
        if (!workspaceId) return;

        setIsLoadingHistory(true);
        try {
            const result = await ThreadService.getAllThreads(workspaceId, 100, 0);
            setChatHistory(result.items);
        } catch (e) {
            console.error('Failed to refresh chat history:', e);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [workspaceId]);

    return {
        chatHistory,
        isLoadingHistory,
        deleteThread,
        renameThread,
        addThread,
        updateThread,
        searchThreads,
        refreshHistory,
        setChatHistory
    };
};

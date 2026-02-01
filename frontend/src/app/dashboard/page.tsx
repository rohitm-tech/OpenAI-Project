'use client';

import { useEffect, useState, useCallback } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import ChatHistory from '@/components/chat/ChatHistory';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkAuth } from '@/store/slices/authSlice';
import { conversationService } from '@/services/conversations';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, isAuthenticated } = useAppSelector((state) => state.auth);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewConversation = useCallback(async () => {
    // If there's a current conversation, check if it has messages
    if (currentConversationId) {
      try {
        const response = await conversationService.getById(currentConversationId);
        if (response.success) {
          // If the conversation has no messages, just clear it instead of creating a new one
          const messageCount = response.data.messages?.length || response.data.messageCount || 0;
          if (messageCount === 0) {
            setCurrentConversationId(null);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking conversation:', error);
        // If we can't check, just clear it
        setCurrentConversationId(null);
        return;
      }
    }

    // If no current conversation or current conversation has messages, create a new one
    try {
      const response = await conversationService.create();
      if (response.success) {
        setCurrentConversationId(response.data._id);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Still allow new conversation without saving
      setCurrentConversationId(null);
    }
  }, [currentConversationId]);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSelectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  const handleConversationUpdated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 top-16 flex overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Sidebar */}
      <ChatHistory
        key={refreshTrigger}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface
          conversationId={currentConversationId || undefined}
          onNewConversation={handleNewConversation}
          onConversationUpdated={handleConversationUpdated}
          onConversationIdChange={(id) => setCurrentConversationId(id)}
        />
      </div>
    </div>
  );
}

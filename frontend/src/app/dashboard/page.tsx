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

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleNewConversation = useCallback(async () => {
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
  }, []);

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
        />
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  MoreHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  AlertTriangle
} from 'lucide-react';
import { conversationService, Conversation } from '@/services/conversations';
import { formatDistanceToNow } from 'date-fns';

interface ChatHistoryProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function ChatHistory({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isCollapsed = false,
  onToggleCollapse,
}: ChatHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await conversationService.getAll();
      if (response.success) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conv);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    try {
      setDeletingId(conversationToDelete._id);
      await conversationService.delete(conversationToDelete._id);
      setConversations((prev) => prev.filter((c) => c._id !== conversationToDelete._id));
      if (currentConversationId === conversationToDelete._id) {
        onNewConversation();
      }
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by date
  const groupedConversations = filteredConversations.reduce((groups, conv) => {
    const date = new Date(conv.updatedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let group = 'Older';
    if (date.toDateString() === today.toDateString()) {
      group = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday';
    } else if (date > weekAgo) {
      group = 'This Week';
    }

    if (!groups[group]) groups[group] = [];
    groups[group].push(conv);
    return groups;
  }, {} as Record<string, Conversation[]>);

  if (isCollapsed) {
    return (
      <div className="w-12 h-full min-h-0 border-r bg-muted/30 flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onToggleCollapse}
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onNewConversation}
          title="New chat"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-72 h-full min-h-0 border-r bg-muted/30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between shrink-0">
        <h2 className="font-semibold text-sm">Chat History</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onNewConversation}
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-8 text-sm border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <Button
                variant="link"
                size="sm"
                onClick={onNewConversation}
                className="mt-2"
              >
                Start a new chat
              </Button>
            )}
          </div>
        ) : (
          <div className="py-2">
            {['Today', 'Yesterday', 'This Week', 'Older'].map((group) => {
              const items = groupedConversations[group];
              if (!items || items.length === 0) return null;

              return (
                <div key={group} className="mb-2">
                  <div className="px-3 py-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {group}
                    </span>
                  </div>
                  {items.map((conv) => (
                    <button
                      key={conv._id}
                      onClick={() => onSelectConversation(conv._id)}
                      className={`w-full px-3 py-2 text-left group flex items-center gap-2 hover:bg-muted/50 transition-colors ${
                        currentConversationId === conv._id
                          ? 'bg-muted'
                          : ''
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conv.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conv.messageCount || 0} messages
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => handleDeleteClick(conv, e)}
                        disabled={deletingId === conv._id}
                      >
                        {deletingId === conv._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        )}
                      </Button>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t text-center shrink-0">
        <p className="text-xs text-muted-foreground">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogClose onClose={handleDeleteCancel} />
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle className="text-left">Delete Conversation</DialogTitle>
            </div>
            <DialogDescription className="text-left pt-2">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{conversationToDelete?.title}"</span>? This action cannot be undone and all messages in this conversation will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingId !== null}
            >
              {deletingId === conversationToDelete?._id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/store/chat-store';
import { ChatMessage } from './message';
import { ChatInput } from './chat-input';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';

export function ChatInterface() {
  const { 
    currentChatroomId, 
    getCurrentChatroom, 
    isTyping, 
    loadMoreMessages, 
    canLoadMore,
    isFetchingMore,
    getMessages,
  } = useChatStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatroom = getCurrentChatroom();
  const messages = currentChatroomId ? getMessages(currentChatroomId) : [];
  const hasMessages = messages.length > 0;
  
  const [loadMoreRef, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });
  
  // Handle loading more messages when scrolling to the top
  useEffect(() => {
    if (inView && currentChatroomId && canLoadMore(currentChatroomId) && !isFetchingMore) {
      loadMoreMessages(currentChatroomId);
    }
  }, [inView, currentChatroomId, canLoadMore, loadMoreMessages, isFetchingMore]);
  
  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  // Auto-scroll to bottom when messages change or when typing indicator appears
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      // Only auto-scroll if we're near the bottom or if it's a new message
      if (isNearBottom || !hasMessages) {
        scrollToBottom();
      }
    }
  }, [messages, isTyping, scrollToBottom, hasMessages]);

  if (!currentChatroomId) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <h2 className="mb-2 text-2xl font-bold">No chat selected</h2>
        <p className="text-muted-foreground">
          Select a chat from the sidebar or create a new one to get started
        </p>
      </div>
    );
  }

  if (!chatroom) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">Chat not found</h2>
          <p className="text-muted-foreground">The selected chat could not be found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h1 className="text-lg font-semibold">{chatroom.title}</h1>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="flex flex-col">
          {/* Load more trigger (invisible element at the top) */}
          {hasMessages && canLoadMore(currentChatroomId!) && (
            <div ref={loadMoreRef} className="h-1 w-full" />
          )}

          {/* Messages (oldest at top, newest at bottom) */}
          {!hasMessages ? (
            <div className="flex h-full flex-1 flex-col items-center justify-center p-8 text-center">
              <h2 className="mb-2 text-2xl font-bold">No messages yet</h2>
              <p className="text-muted-foreground">
                Send a message to start the conversation
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}

          {/* Typing indicator for new messages */}
          {isTyping && (
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-muted">
                <img 
                  src="/gemini-logo.png" 
                  alt="AI" 
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-2 w-2 rounded-full delay-75" />
                <Skeleton className="h-2 w-2 rounded-full delay-150" />
              </div>
            </div>
          )}

          {/* Loading indicator when loading more messages */}
          {(isFetchingMore || isTyping) && (
            <div className="flex justify-center p-2">
              <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-2 w-2 rounded-full delay-75" />
                  <Skeleton className="h-2 w-2 rounded-full delay-150" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {isFetchingMore ? 'Loading older messages...' : 'AI is typing...'}
                </span>
              </div>
            </div>
          )}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>
      
      <ChatInput />
    </div>
  );
}

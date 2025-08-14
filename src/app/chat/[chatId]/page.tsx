'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const { 
    chatrooms, 
    setCurrentChatroom, 
    getMessages, 
    sendMessage, 
    isTyping 
  } = useChatStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const chatroom = chatrooms.find(cr => cr.id === chatId);
    if (chatroom) {
      setCurrentChatroom(chatroom.id);
    } else {
      router.push('/dashboard');
    }
  }, [chatId, chatrooms, router, setCurrentChatroom, user]);

  const currentChatroom = chatrooms.find(cr => cr.id === chatId);
  
  if (!currentChatroom) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    const messageToSend = message.trim();
    setMessage(''); // Clear input immediately for better UX
    setIsSending(true);
    
    try {
      if (imagePreview) {
        await sendMessage(`[Image] ${messageToSend || 'Image shared'}`, true, imagePreview);
        setImagePreview(null);
      } else {
        await sendMessage(messageToSend);
      }
      
      // Scroll to bottom after a short delay to allow the message to be rendered
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      
      // Restore the message if there was an error
      setMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if image
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Auto-scroll to bottom when messages change or when typing status changes
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [getMessages(chatId), isTyping]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Send message on Cmd+Enter or Ctrl+Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (message.trim() && !isSending) {
          handleSendMessage(e as unknown as React.FormEvent);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [message, isSending]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold">{currentChatroom.title}</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {getMessages(chatId).map((message) => {
            const isUser = message.sender === 'user';
            return (
              <div 
                key={message.id} 
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-lg ${
                  isUser 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <div className="text-sm font-medium mb-1">
                    {isUser ? 'You' : 'AI'}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {message.content.replace(/^\[Image\]\s*/, '')}
                  </div>
                  {message.isImage && message.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={message.imageUrl} 
                        alt="Uploaded content" 
                        className="max-w-full h-auto rounded-md border"
                      />
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex items-center space-x-2 p-4">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-sm text-muted-foreground ml-2">AI is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t p-4 bg-background/80 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
          {imagePreview && (
            <div className="relative mb-2 max-w-xs">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-24 w-24 object-cover rounded-md border"
              />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-muted"
              disabled={isSending}
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={isSending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!message.trim() && !imagePreview || isSending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

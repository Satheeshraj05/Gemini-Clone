import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { generateGeminiResponse, type GeminiMessage } from '@/lib/gemini';

// Toast notification will be used via a callback to avoid React hook rules
let showToast: ((message: string, type: 'success' | 'error' | 'info' | 'warning', options?: { description?: string; durationMs?: number }) => void) | null = null;

// Function to set the toast callback from a React component
export const setToastCallback = (callback: typeof showToast) => {
  showToast = callback;
};

// Custom storage with SSR safety and error handling
const createCustomStorage = (): StateStorage => {
  // Return a no-op storage during SSR
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  // Client-side storage with error handling
  return {
    getItem: (name: string): string | null => {
      try {
        return localStorage.getItem(name);
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        localStorage.setItem(name, value);
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
    },
  };
};

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: number;
  isImage?: boolean;
  imageUrl?: string;
}

interface MessageChunk {
  id: string;
  messages: Message[];
  createdAt: number;
}

export interface Chatroom {
  id: string;
  title: string;
  messageChunks: MessageChunk[];
  hasMore: boolean;
  nextPageToken?: string;
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  chatrooms: Chatroom[];
  currentChatroomId: string | null;
  isLoading: boolean;
  isTyping: boolean;
  isFetchingMore: boolean;
  createChatroom: (title: string) => string;
  deleteChatroom: (id: string) => void;
  sendMessage: (content: string, isImage?: boolean, imageUrl?: string) => void;
  setCurrentChatroom: (id: string | null) => void;
  setIsTyping: (isTyping: boolean) => void;
  getCurrentChatroom: () => Chatroom | undefined;
  updateChatroomTitle: (id: string, title: string) => void;
  loadMoreMessages: (chatroomId: string) => Promise<void>;
  canLoadMore: (chatroomId: string) => boolean;
  getMessages: (chatroomId: string) => Message[];
  clearAllChatData: () => void;
}

const generateId = () => uuidv4();

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chatrooms: [],
      currentChatroomId: null,
      isLoading: false,
      isTyping: false,
      isFetchingMore: false,
      
      createChatroom: (title) => {
        const id = generateId();
        const now = Date.now();
        
        const newChatroom: Chatroom = {
          id,
          title,
          messageChunks: [{
            id: `chunk-${id}-0`,
            messages: [],
            createdAt: now,
          }],
          hasMore: false,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          // Append new chat at the bottom so older chats stay on top
          chatrooms: [...state.chatrooms, newChatroom],
          currentChatroomId: id,
        }));
        
        // Show success toast
        if (showToast) {
          showToast('Chat created', 'success', { description: `Created new chat: ${title}` });
        }
        
        return id;
      },
      
      deleteChatroom: (id) => {
        set((state) => {
          const chatToDelete = state.chatrooms.find(chat => chat.id === id);
          return {
            chatrooms: state.chatrooms.filter((chat) => chat.id !== id),
            currentChatroomId: state.currentChatroomId === id ? null : state.currentChatroomId,
          };
        });
        
        // Show success toast
        if (showToast) {
          showToast('Chat deleted', 'success', { description: 'The chat has been deleted' });
        }
      },
      
      sendMessage: async (content: string, isImage = false, imageUrl = '') => {
        const state = get();
        if (!state.currentChatroomId) {
          console.error('No active chatroom');
          return;
        }

        try {
          // Add user message
          const userMessage: Message = {
            id: generateId(),
            content: isImage ? `[Image] ${content}` : content,
            sender: 'user',
            timestamp: Date.now(),
            isImage,
            imageUrl: isImage ? imageUrl : undefined,
          };

          // Update state with user message
          set((state) => ({
            chatrooms: state.chatrooms.map((chat) =>
              chat.id === state.currentChatroomId
                ? {
                    ...chat,
                    messageChunks: [
                      {
                        id: `chunk-${Date.now()}`,
                        messages: [userMessage],
                        createdAt: Date.now(),
                      },
                      ...chat.messageChunks,
                    ],
                    updatedAt: Date.now(),
                  }
                : chat
            ),
            isTyping: true,
          }));

          // Skip AI response for image-only messages
          if (isImage) return;

          // Get recent messages for context (last 5 messages)
          const recentMessages = state.chatrooms
            .find(chat => chat.id === state.currentChatroomId)
            ?.messageChunks.flatMap(chunk => 
              chunk.messages.map(msg => ({
                role: msg.sender as 'user' | 'model',
                parts: [{ text: msg.content }],
              }))
            )
            .slice(-5) || [];

          // Prepare conversation history for Gemini
          const conversationHistory: GeminiMessage[] = [
            // System message
            {
              role: 'user',
              parts: [{ text: 'You are a helpful AI assistant. Keep your responses concise and helpful.' }],
            },
            {
              role: 'model',
              parts: [{ text: 'I am a helpful AI assistant. How can I help you today?' }],
            },
            // Add recent conversation history
            ...recentMessages,
            // Add current message
            {
              role: 'user',
              parts: [{ text: content }],
            },
          ];

          try {
            console.log('Generating AI response with history:', JSON.stringify(conversationHistory, null, 2));
            
            // Generate AI response
            const aiResponse = await generateGeminiResponse(conversationHistory);
            
            console.log('Received AI response:', aiResponse);
            
            const aiMessage: Message = {
              id: generateId(),
              content: aiResponse,
              sender: 'ai',
              timestamp: Date.now(),
            };
            
            // Update state with AI response
            set((state) => {
              const updatedChatrooms = state.chatrooms.map((chat) =>
                chat.id === state.currentChatroomId
                  ? {
                      ...chat,
                      messageChunks: [
                        {
                          id: `chunk-${Date.now()}`,
                          messages: [aiMessage],
                          createdAt: Date.now(),
                        },
                        ...chat.messageChunks,
                      ],
                      updatedAt: Date.now(),
                    }
                  : chat
              );
              
              return {
                chatrooms: updatedChatrooms,
                isTyping: false,
              };
            });
            
            // Scroll to bottom after AI response
            setTimeout(() => {
              const messagesContainer = document.querySelector('.messages-container');
              if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
            }, 100);
            
          } catch (error) {
            console.error('Error generating AI response:', error);
            
            const errorMessage: Message = {
              id: generateId(),
              content: 'Sorry, I encountered an error while generating a response. Please try again.',
              sender: 'ai',
              timestamp: Date.now(),
            };
            
            set((state) => ({
              chatrooms: state.chatrooms.map((chat) =>
                chat.id === state.currentChatroomId
                  ? {
                      ...chat,
                      messageChunks: [
                        {
                          id: `chunk-${Date.now()}`,
                          messages: [errorMessage],
                          createdAt: Date.now(),
                        },
                        ...chat.messageChunks,
                      ],
                      updatedAt: Date.now(),
                    }
                  : chat
              ),
              isTyping: false,
            }));
            
            throw error; // Re-throw to be caught by the outer try-catch
          }
        } catch (error) {
          console.error('Error in sendMessage:', error);
          set({ isTyping: false });
          
          if (showToast) {
            showToast('Failed to send message', 'error', { 
              description: 'An error occurred while sending your message' 
            });
          }
        }
      },
      
      setCurrentChatroom: (id) => {
        set({ currentChatroomId: id });
      },
      
      setIsTyping: (isTyping) => {
        set({ isTyping });
      },
      
      getCurrentChatroom: () => {
        const { currentChatroomId, chatrooms } = get();
        return chatrooms.find((chat) => chat.id === currentChatroomId);
      },
      
      canLoadMore: (chatroomId) => {
        const chatroom = get().chatrooms.find(chat => chat.id === chatroomId);
        return chatroom ? chatroom.hasMore : false;
      },
      
      loadMoreMessages: async (chatroomId) => {
        const { chatrooms, isFetchingMore } = get();
        const chatroom = chatrooms.find(chat => chat.id === chatroomId);
        
        if (!chatroom || isFetchingMore || !chatroom.hasMore) return;
        
        set({ isFetchingMore: true });
        
        try {
          // Simulate API call to fetch older messages
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Generate dummy older messages (10 messages per chunk)
          const chunkId = `chunk-${Date.now()}`;
          const olderMessages: Message[] = Array.from({ length: 10 }, (_, i) => ({
            id: `msg-${chunkId}-${i}`,
            content: `Older message #${chatroom.messageChunks.length * 10 + i + 1}`,
            sender: Math.random() > 0.5 ? 'user' : 'ai',
            timestamp: Date.now() - (chatroom.messageChunks.length * 10 + i + 1) * 60000, // 1 minute apart
          }));
          
          const newChunk: MessageChunk = {
            id: chunkId,
            messages: olderMessages,
            createdAt: Date.now(),
          };
          
          set((state) => {
            const updatedChatrooms = state.chatrooms.map((chat) =>
              chat.id === chatroomId
                ? {
                    ...chat,
                    messageChunks: [...chat.messageChunks, newChunk],
                    hasMore: chat.messageChunks.length < 4, // Load 4 chunks (40 messages) for demo
                    nextPageToken: chat.messageChunks.length < 4 ? `page-${chat.messageChunks.length + 1}` : undefined,
                  }
                : chat
            );
            
            return {
              chatrooms: updatedChatrooms,
              isFetchingMore: false,
            };
          });
        } catch (error) {
          console.error('Failed to load more messages:', error);
          set({ isFetchingMore: false });
        }
      },
      
      getMessages: (chatroomId) => {
        const chatroom = get().chatrooms.find(chat => chat.id === chatroomId);
        if (!chatroom) return [];
        
        // Flatten all message chunks and sort by timestamp ascending
        // Oldest at the top, newest at the bottom
        return chatroom.messageChunks
          .flatMap(chunk => chunk.messages)
          .sort((a, b) => a.timestamp - b.timestamp);
      },
      
      updateChatroomTitle: (id, title) => {
        set((state) => ({
          chatrooms: state.chatrooms.map((chat) =>
            chat.id === id ? { ...chat, title, updatedAt: Date.now() } : chat
          ),
        }));
      },
      
      clearAllChatData: () => {
        set({
          chatrooms: [],
          currentChatroomId: null,
          isTyping: false,
          isFetchingMore: false,
        });
      },
    }),
    {
      name: 'gemini-chat-storage',
      storage: createJSONStorage(createCustomStorage),
      version: 1,
      migrate: (persistedState, version) => {
        if (!persistedState) return undefined;
        
        // Handle any future migrations here if needed
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            version: 1,
          };
        }
        
        return persistedState as any;
      },
      // Only persist the chatrooms data, not the UI state
      partialize: (state) => ({
        chatrooms: state.chatrooms.map(({ messageChunks, ...rest }) => ({
          ...rest,
          // Only keep the most recent 2 chunks in storage
          messageChunks: messageChunks.slice(0, 2),
          hasMore: false, // Reset hasMore to prevent loading more on refresh
          nextPageToken: undefined,
        })),
        currentChatroomId: state.currentChatroomId,
      }),
    }
  )
);

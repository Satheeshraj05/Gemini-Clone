'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chat-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Plus, MessageSquare, Search, LogOut } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import ProtectedRoute from '@/components/auth/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const { chatrooms, createChatroom, deleteChatroom, setCurrentChatroom } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatTitle, setNewChatTitle] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  
  const user = session?.user;

  // Filter chatrooms based on search query
  const filteredChatrooms = chatrooms.filter(chatroom =>
    chatroom.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateChat = () => {
    if (!newChatTitle.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your new chat',
        variant: 'destructive',
      });
      return;
    }

    const chatroomId = createChatroom(newChatTitle);
    setNewChatTitle('');
    setIsCreatingChat(false);
    
    // Navigate to the new chat
    router.push(`/chat/${chatroomId}`);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Confirm before deleting
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      deleteChatroom(chatId);
      toast({
        title: 'Chat deleted',
        description: 'The chat has been deleted successfully.',
      });
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  if (!user) {
    return null; // Will be handled by ProtectedRoute
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex flex-col flex-1 h-0">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gemini Chat</h1>
            </div>
            
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Button 
                onClick={() => setIsCreatingChat(true)}
                className="w-full"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search chats..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="px-2 space-y-1">
                {[...filteredChatrooms]
                  // Show oldest chats first (top), newest at bottom
                  .sort((a, b) => a.createdAt - b.createdAt)
                  .map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/chat/${chat.id}`}
                      className="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md group hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="truncate">{chat.title}</span>
                      <button
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        aria-label="Delete chat"
                      >
                        ×
                      </button>
                    </Link>
                  ))}
                
                {filteredChatrooms.length === 0 && (
                  <div className="px-3 py-2 text-sm text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No matching chats found' : 'No chats yet'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gemini Chat</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreatingChat(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h2 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                {chatrooms.length === 0 ? 'Welcome to Gemini Chat' : 'Select a chat to continue'}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {chatrooms.length === 0
                  ? 'Get started by creating a new chat.'
                  : 'Or create a new chat to start a conversation.'}
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => setIsCreatingChat(true)}
                  className="inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Create Chat Modal */}
      {isCreatingChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create New Chat
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="chat-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chat Title
                </label>
                <Input
                  id="chat-title"
                  placeholder="Enter a title for your chat"
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewChatTitle('');
                    setIsCreatingChat(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateChat} disabled={!newChatTitle.trim()}>
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

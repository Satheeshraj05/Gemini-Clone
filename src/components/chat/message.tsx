import { cn } from '@/lib/utils';
import { Message } from '@/store/chat-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface MessageProps {
  message: Message;
  className?: string;
}

export function ChatMessage({ message, className }: MessageProps) {
  const { toast } = useToast();
  const isUser = message.sender === 'user';
  const timestamp = format(new Date(message.timestamp), 'h:mm a');

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: 'Copied to clipboard',
      // @ts-ignore - duration is a valid property in the toast component
      duration: 2000,
    });
  };

  return (
    <div
      className={cn(
        'group flex w-full items-start gap-3 px-4 py-3 hover:bg-muted/50',
        isUser ? 'bg-muted/30' : 'bg-background',
        className
      )}
    >
      <Avatar className="h-8 w-8">
        {isUser ? (
          <AvatarFallback>U</AvatarFallback>
        ) : (
          <AvatarImage src="/gemini-logo.png" alt="AI" />
        )}
      </Avatar>
      
      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {isUser ? 'You' : 'Gemini'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{timestamp}</span>
            {!isUser && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={handleCopy}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="prose prose-sm max-w-none break-words dark:prose-invert">
          {message.isImage && message.imageUrl ? (
            <div className="mt-2 overflow-hidden rounded-lg">
              <img
                src={message.imageUrl}
                alt="Uploaded content"
                className="max-h-64 max-w-full rounded-md object-cover"
              />
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}

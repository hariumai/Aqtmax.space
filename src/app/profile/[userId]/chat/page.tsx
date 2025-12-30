
'use client';
import { useState, useRef, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, Loader2, Plus, Home } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { askSupport } from '@/ai/flows/support-chat-flow';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

function ChatBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';
    return (
        <div className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>
            {!isUser && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                </Avatar>
            )}
            <div
                className={cn(
                    'max-w-[70%] rounded-2xl p-3 text-sm shadow-md',
                    isUser
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-card rounded-bl-none'
                )}
            >
                <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
}

// Helper function to convert Firestore Timestamps to strings
const convertTimestamps = (obj: any): any => {
    if (!obj) return obj;
    if (obj instanceof Timestamp) {
        return obj.toDate().toISOString();
    }
    if (Array.isArray(obj)) {
        return obj.map(convertTimestamps);
    }
    if (typeof obj === 'object' && obj !== null) {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            newObj[key] = convertTimestamps(obj[key]);
        }
        return newObj;
    }
    return obj;
};

export default function AuthenticatedChatPage({ params }: { params: { userId: string } }) {
  const resolvedParams = use(params);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! As a logged-in user, I have access to your account details. Ask me about your orders or store credit. How can I help?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // SECURE: Ensure we are only loading data for the user specified in the URL if it matches the logged-in user.
  const effectiveUserId = !isUserLoading && user?.uid === resolvedParams.userId ? resolvedParams.userId : undefined;

  const userRef = useMemoFirebase(() => (firestore && effectiveUserId ? doc(firestore, 'users', effectiveUserId) : null), [firestore, effectiveUserId]);
  const { data: userData } = useDoc(userRef);

  const ordersQuery = useMemoFirebase(
    () => (firestore && effectiveUserId ? query(collection(firestore, 'orders'), where('userId', '==', effectiveUserId)) : null),
    [firestore, effectiveUserId]
  );
  const { data: userOrders } = useCollection(ordersQuery);

  const form = useForm<z.infer<typeof chatSchema>>({
    resolver: zodResolver(chatSchema),
    defaultValues: { message: '' },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if(scrollableView) {
            scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  }, [messages]);

  const onSubmit = async (values: z.infer<typeof chatSchema>) => {
    if (!effectiveUserId) {
        // Don't allow interaction if the user is not authorized for this chat
        setMessages(prev => [...prev, {role: 'assistant', content: "Sorry, you are not authorized to access this chat."}]);
        return;
    }

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: values.message };
    setMessages((prev) => [...prev, userMessage]);
    form.reset();

    try {
      // Sanitize data before sending to server action
      const sanitizedUserData = convertTimestamps(userData);
      const sanitizedOrders = userOrders ? convertTimestamps(userOrders) : [];

      const input = {
        query: values.message,
        userContext: { userProfile: sanitizedUserData, userOrders: sanitizedOrders },
      };

      const response = await askSupport(input);
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI support chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  if (!user || user.uid !== resolvedParams.userId) {
       return (
            <div className="flex h-screen items-center justify-center text-center p-4">
                <div>
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground">You are not authorized to view this chat.</p>
                    <Button asChild variant="link" className="mt-4">
                        <Link href="/">Return to Home</Link>
                    </Button>
                </div>
            </div>
       )
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="flex items-center p-4 border-b bg-card shadow-sm z-10">
            <Avatar className="h-10 w-10">
                <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1">
                <h3 className="font-semibold">SubLime Mat</h3>
                <div className="flex items-center gap-1">
                    {isLoading ? (
                        <>
                            <div className="h-2 w-2 rounded-full bg-primary/50 animate-pulse"></div>
                            <p className="text-xs text-muted-foreground animate-pulse">typing...</p>
                        </>
                    ) : (
                        <>
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <p className="text-xs text-muted-foreground">Online</p>
                        </>
                    )}
                </div>
            </div>
            <Button asChild variant="ghost" size="icon">
                <Link href="/">
                    <Home className="h-5 w-5" />
                    <span className="sr-only">Go Home</span>
                </Link>
            </Button>
        </header>

        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
                {messages.map((message, index) => (
                    <ChatBubble key={index} message={message} />
                ))}
                {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-card rounded-2xl p-3 rounded-bl-none shadow-md">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>

        <div className="p-4 border-t bg-card">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                    <Button type="button" variant="default" size="icon" className="shrink-0 rounded-full h-10 w-10">
                        <Plus className="h-5 w-5" />
                    </Button>
                    <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Message..."
                                        className="rounded-full border-input bg-background focus-visible:ring-1 focus-visible:ring-ring"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            form.handleSubmit(onSubmit)();
                                            }
                                        }}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" size="icon" disabled={isLoading} className="rounded-full h-10 w-10">
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </Form>
        </div>
    </div>
  );
}

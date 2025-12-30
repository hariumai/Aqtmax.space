'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, Loader2, Plus } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { askSupport } from '@/ai/flows/support-chat-flow';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
                    'max-w-xs sm:max-w-lg rounded-2xl p-3 text-sm',
                    isUser
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted rounded-bl-none'
                )}
            >
                <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
             {isUser && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your AI support assistant. How can I help you today?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userData } = useDoc(userRef);

  const ordersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'orders'), where('userId', '==', user.uid)) : null),
    [firestore, user]
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
    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: values.message };
    setMessages((prev) => [...prev, userMessage]);
    form.reset();

    try {
      const input = {
        query: values.message,
        userContext: user ? { userProfile: userData, userOrders: userOrders } : undefined,
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

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow flex items-center justify-center py-16">
        <div className="w-full max-w-2xl h-[70vh] bg-card rounded-2xl shadow-2xl flex flex-col overflow-hidden border">
          <header className="flex items-center p-4 border-b">
            <Avatar className="h-10 w-10">
                <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
            </Avatar>
            <div className="ml-3">
                <h3 className="font-semibold">AI Assistant</h3>
                <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-xs text-muted-foreground">Online</p>
                </div>
            </div>
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
                    <div className="bg-muted rounded-2xl p-3 rounded-bl-none">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-background/50">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full">
                    <Plus className="h-5 w-5" />
                </Button>
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Type your message..."
                          className="min-h-0 resize-none rounded-full border-0 shadow-none focus-visible:ring-0 px-4 py-2 bg-muted"
                          rows={1}
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
                <Button type="submit" size="icon" disabled={isLoading} className="rounded-full">
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

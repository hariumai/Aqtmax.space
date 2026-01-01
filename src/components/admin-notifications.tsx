
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendNotification } from '@/lib/notifications';

const notificationSchema = z.object({
  message: z.string().min(5, 'Message must be at least 5 characters.'),
  href: z.string().startsWith('/', "Link must start with a '/'. Eg: /products"),
  target: z.enum(['all', 'single'], { required_error: 'You must select a target.' }),
  userId: z.string().optional(),
}).refine(data => {
    if (data.target === 'single') {
        return !!data.userId;
    }
    return true;
}, {
    message: 'A user must be selected for single target.',
    path: ['userId'],
});


export default function AdminNotifications() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  const { data: users } = useCollection(usersQuery);


  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      message: '',
      href: '/',
      target: 'all',
      userId: '',
    },
  });

  const target = form.watch('target');
  
  async function onSubmit(values: z.infer<typeof notificationSchema>) {
      setIsSubmitting(true);
      try {
          const result = await sendNotification(values);
          if (result.success) {
              toast({ title: 'Success', description: result.message });
              form.reset();
          } else {
              throw new Error(result.message);
          }
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error sending notification', description: error.message });
      } finally {
          setIsSubmitting(false);
      }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Notifications</CardTitle>
        <CardDescription>Send a notification to a specific user or all users.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Notification Target</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="all" /></FormControl>
                        <FormLabel className="font-normal">All Users</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="single" /></FormControl>
                        <FormLabel className="font-normal">Single User</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {target === 'single' && (
                <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Select User</FormLabel>
                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn( "w-[300px] justify-between", !field.value && "text-muted-foreground" )}
                                    >
                                    {field.value ? users?.find(user => user.id === field.value)?.name : "Select a user"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search user..." />
                                        <CommandEmpty>No user found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandList>
                                                {users?.map(user => (
                                                    <CommandItem
                                                        value={user.name}
                                                        key={user.id}
                                                        onSelect={() => {
                                                            form.setValue("userId", user.id);
                                                            setPopoverOpen(false);
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", user.id === field.value ? "opacity-100" : "opacity-0")} />
                                                        <div className='flex flex-col'>
                                                            <span>{user.name}</span>
                                                            <span className='text-xs text-muted-foreground'>{user.email}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandList>
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                             <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter your notification message..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="href"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link</FormLabel>
                  <FormControl>
                    <Input placeholder="/profile" {...field} />
                  </FormControl>
                   <FormDescription>
                    The page the user will be sent to when they click the notification.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Notification'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

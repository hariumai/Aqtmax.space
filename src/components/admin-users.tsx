
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useAuth, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from './ui/button';
import { Mail, Trash, Edit, Ban } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from './ui/dialog';
import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const banSchema = z.object({
  type: z.enum(['temporary', 'permanent']),
  reason: z.string().min(1, 'A reason is required for the ban.'),
  expiresAt: z.coerce.date().optional(),
}).refine(data => {
  if (data.type === 'temporary') {
    return !!data.expiresAt;
  }
  return true;
}, {
  message: 'Expiration date is required for temporary bans.',
  path: ['expiresAt'],
});

function BanUserForm({ user, onFinished }: { user: any; onFinished: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof banSchema>>({
    resolver: zodResolver(banSchema),
    defaultValues: {
      type: user.ban?.type || 'temporary',
      reason: user.ban?.reason || '',
      expiresAt: user.ban?.expiresAt ? new Date(user.ban.expiresAt) : undefined,
    }
  });

  async function onSubmit(values: z.infer<typeof banSchema>) {
    if (!firestore) return;
    try {
      const userRef = doc(firestore, 'users', user.id);
      await updateDoc(userRef, {
        ban: {
          isBanned: true,
          type: values.type,
          reason: values.reason,
          expiresAt: values.type === 'temporary' ? values.expiresAt?.toISOString() : null,
        }
      });
      toast({ title: 'User Banned', description: `${user.name} has been banned.` });
      onFinished();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error banning user', description: e.message });
    }
  }

  const banType = form.watch('type');
  
  const getFormattedDateTime = (date?: Date) => {
    if (!date) return '';
    // Format to "YYYY-MM-DDTHH:mm"
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ban Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        {banType === 'temporary' && (
           <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Expires At</FormLabel>
                    <FormControl>
                        <Input
                            type="datetime-local"
                            {...field}
                            value={field.value ? getFormattedDateTime(new Date(field.value)) : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        )}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl><Input placeholder="e.g., ToS Violation" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button type="submit">Apply Ban</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default function AdminUsers() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [creditAmount, setCreditAmount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);

  const usersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'users')) : null),
    [firestore, user]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);

  const handlePasswordReset = async (email: string) => {
    if (!auth) return;
    try {
        const actionCodeSettings = {
            url: `${window.location.origin}/actions`,
            handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        toast({
            title: 'Password Reset Email Sent',
            description: `An email has been sent to ${email}.`,
        });
    } catch (error: any) {
        const errorMessage = (error.message || 'An unexpected error occurred.').replace('Firebase: ', '');
        toast({
            variant: 'destructive',
            title: 'Error',
            description: errorMessage,
        });
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, 'users', userId));
        toast({
            title: 'User Document Deleted',
            description: 'The user\'s document has been removed from Firestore.',
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error Deleting User',
            description: error.message || 'An unexpected error occurred.',
        });
    }
  };

  const openCreditDialog = (user: any) => {
    setSelectedUser(user);
    setCreditAmount(user.storeCredit || 0);
    setIsCreditDialogOpen(true);
  };

  const openBanDialog = (user: any) => {
    setSelectedUser(user);
    setIsBanDialogOpen(true);
  };
  
  const handleUnban = async (userId: string) => {
    if (!firestore) return;
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        "ban.isBanned": false,
      });
      toast({ title: "User Unbanned", description: "The user's ban has been lifted." });
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error Unbanning User', description: error.message });
    }
  };

  const handleUpdateCredit = async () => {
    if (!firestore || !selectedUser || !user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to perform this action.' });
        return;
    }
    try {
      const userRef = doc(firestore, 'users', selectedUser.id);
      await updateDoc(userRef, {
        storeCredit: Number(creditAmount)
      });
      toast({
        title: 'Store Credit Updated',
        description: `${selectedUser.name}'s credit has been updated to ${creditAmount} PKR.`
      });
      setIsCreditDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error Updating Credit', description: error.message });
    }
  };


  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
            Manage your application's users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Store Credit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingUsers ? (
              <TableRow>
                <TableCell colSpan={5}>Loading users...</TableCell>
              </TableRow>
            ) : (
              users?.map((user) => (
                <TableRow key={user.id} className={user.ban?.isBanned ? 'bg-destructive/10' : ''}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <span>{user.storeCredit?.toFixed(2) || '0.00'} PKR</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openCreditDialog(user)}>
                            <Edit className="h-3 w-3" />
                        </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.ban?.isBanned ? (
                      <Badge variant="destructive" className="capitalize">{user.ban.type}</Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handlePasswordReset(user.email)}>
                        <Mail className="h-4 w-4" />
                        <span className="sr-only">Send Password Reset</span>
                    </Button>
                     {user.ban?.isBanned ? (
                        <Button variant="ghost" size="sm" onClick={() => handleUnban(user.id)}>Unban</Button>
                    ) : (
                        <Button variant="ghost" size="icon" onClick={() => openBanDialog(user)}>
                            <Ban className="h-4 w-4" />
                            <span className="sr-only">Ban User</span>
                        </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete User</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete the user's data from Firestore. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoadingUsers && users?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">No users found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Store Credit for {selectedUser?.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="credit-amount">Credit Amount (PKR)</Label>
                    <Input 
                        id="credit-amount"
                        type="number"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(Number(e.target.value))}
                        placeholder="e.g., 500"
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleUpdateCredit}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ban User: {selectedUser?.name}</DialogTitle>
                    <DialogDescription>Select the type of ban and provide a reason.</DialogDescription>
                </DialogHeader>
                {selectedUser && <BanUserForm user={selectedUser} onFinished={() => setIsBanDialogOpen(false)} />}
            </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
    </>
  );
}

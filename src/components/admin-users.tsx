
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useAuth, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from './ui/button';
import { Mail, Trash, Edit } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from './ui/dialog';
import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function AdminUsers() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [creditAmount, setCreditAmount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);

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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingUsers ? (
              <TableRow>
                <TableCell colSpan={4}>Loading users...</TableCell>
              </TableRow>
            ) : (
              users?.map((user) => (
                <TableRow key={user.id}>
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
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handlePasswordReset(user.email)}>
                        <Mail className="h-4 w-4" />
                        <span className="sr-only">Send Password Reset</span>
                    </Button>
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
                    <TableCell colSpan={4} className="text-center">No users found.</TableCell>
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

      </CardContent>
    </Card>
  );
}


'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, doc, updateDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from './ui/button';
import { Mail, Trash, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useState } from 'react';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';

type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: any;
  isRead: boolean;
};

export default function AdminContactForms() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);

  const submissionsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'contactSubmissions'), orderBy('submittedAt', 'desc')) : null),
    [firestore]
  );
  const { data: submissions, isLoading } = useCollection<ContactSubmission>(submissionsQuery);

  const handleMarkAsRead = async (submission: ContactSubmission) => {
    if (!firestore || submission.isRead) return;
    try {
      const submissionRef = doc(firestore, 'contactSubmissions', submission.id);
      await updateDoc(submissionRef, { isRead: true });
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  const openViewDialog = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    handleMarkAsRead(submission);
  };
  
  const closeViewDialog = () => {
    setSelectedSubmission(null);
  }

  const handleDelete = async (submissionId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'contactSubmissions', submissionId));
      toast({
        title: 'Submission Deleted',
        description: 'The contact submission has been successfully deleted.',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting submission',
        description: e.message,
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Contact Form Submissions</CardTitle>
          <CardDescription>View messages sent through your contact form.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4}>Loading submissions...</TableCell>
                </TableRow>
              )}
              {!isLoading && submissions?.map((submission) => (
                <TableRow key={submission.id} className={!submission.isRead ? 'font-bold bg-muted/50' : ''}>
                  <TableCell>
                    <div>{submission.name}</div>
                    <div className={`text-xs ${!submission.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{submission.email}</div>
                  </TableCell>
                  <TableCell>{submission.subject}</TableCell>
                  <TableCell>
                    {submission.submittedAt ? formatDistanceToNow(submission.submittedAt.toDate(), { addSuffix: true }) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openViewDialog(submission)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this message from "{submission.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(submission.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && submissions?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No submissions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && closeViewDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSubmission?.subject}</DialogTitle>
            <DialogDescription>
              From: {selectedSubmission?.name} &lt;{selectedSubmission?.email}&gt;
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
            {selectedSubmission?.message}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

    
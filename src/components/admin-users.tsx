
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminUsers() {
  const firestore = useFirestore();
  const { user } = useUser();

  const usersQuery = useMemo(
    () => (firestore && user ? query(collection(firestore, 'users')) : null),
    [firestore, user]
  );
  const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Signup Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingUsers ? (
              <TableRow>
                <TableCell colSpan={3}>Loading users...</TableCell>
              </TableRow>
            ) : (
              users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.signupCredit?.toFixed(2) || '0.00'} PKR</TableCell>
                </TableRow>
              ))
            )}
            {!isLoadingUsers && users?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={3} className="text-center">No users found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

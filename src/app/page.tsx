import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BookingApp } from '@/components/BookingApp';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');
  return <BookingApp />;
}

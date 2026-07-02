import type { AuthUser } from '@/lib/auth-client';

export interface ClerkUserProfileLike {
  id: string;
  primaryEmailAddress?: { emailAddress: string } | null;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  imageUrl?: string | null;
  createdAt?: Date | null;
}

export function clerkUserToAuthUser(clerkUser: ClerkUserProfileLike): AuthUser {
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? '';
  const joinedName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim();

  return {
    id: clerkUser.id,
    clerkUserId: clerkUser.id,
    email,
    name: clerkUser.fullName ?? (joinedName || email.split('@')[0] || 'Vivu user'),
    role: 'user',
    avatarUrl: clerkUser.imageUrl || null,
    createdAt: clerkUser.createdAt?.toISOString(),
  };
}

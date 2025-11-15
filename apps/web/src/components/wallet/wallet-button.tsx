'use client';

import { useWallet } from '@/lib/wallet/wallet-provider';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, Key, User } from 'lucide-react';
import { formatAddress } from '@nuna-curate/shared';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export function WalletButton() {
  const {
    address,
    isConnected,
    isConnecting,
    isAuthenticated,
    user,
    connect,
    disconnect,
    login
  } = useWallet();

  if (!isConnected) {
    return (
      <Button onClick={connect} disabled={isConnecting}>
        <Wallet className="mr-2 h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  // Connected but not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Wallet className="mr-2 h-4 w-4" />
          {formatAddress(address!)}
        </Button>
        <Button onClick={login} size="sm">
          <Key className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </div>
    );
  }

  // Connected and authenticated
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <User className="mr-2 h-4 w-4" />
          {user?.displayName || user?.username || formatAddress(address!)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">
              {user?.displayName || user?.username}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {formatAddress(address!)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">My Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/create">Create NFT</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/create/collection">Create Collection</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

'use client';

/**
 * WalletConnectButton Component
 *
 * Button to connect/disconnect Stellar wallet with nice UI
 */

import { useState } from 'react';
import { Wallet, LogOut, Copy, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWallet } from '@/lib/hooks/useWallet';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface WalletConnectButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function WalletConnectButton({
  className,
  variant = 'default',
  size = 'default',
}: WalletConnectButtonProps) {
  const { publicKey, isConnected, isConnecting, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openExplorer = () => {
    if (publicKey) {
      const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'TESTNET' ? 'testnet' : 'public';
      window.open(
        `https://stellar.expert/explorer/${network}/account/${publicKey}`,
        '_blank'
      );
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!isConnected || !publicKey) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        variant={variant}
        size={size}
        className={cn('gap-2', className)}
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('gap-2', className)}
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">
            {formatAddress(publicKey)}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Connected Wallet</p>
            <p className="text-xs font-normal text-muted-foreground">
              {publicKey}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy Address</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={openExplorer} className="cursor-pointer">
          <ExternalLink className="mr-2 h-4 w-4" />
          <span>View on Explorer</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDisconnect}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Simpler version for mobile/compact layouts
 */
export function WalletConnectButtonCompact({ className }: { className?: string }) {
  const { publicKey, isConnected, isConnecting, connect, disconnect } = useWallet();

  const handleClick = async () => {
    if (isConnected) {
      disconnect();
    } else {
      try {
        await connect();
      } catch (error) {
        console.error('Connection error:', error);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isConnecting}
      variant={isConnected ? 'outline' : 'default'}
      size="sm"
      className={cn('gap-2', className)}
    >
      <Wallet className="h-4 w-4" />
      {isConnecting
        ? 'Connecting...'
        : isConnected && publicKey
        ? formatAddress(publicKey)
        : 'Connect'}
    </Button>
  );
}

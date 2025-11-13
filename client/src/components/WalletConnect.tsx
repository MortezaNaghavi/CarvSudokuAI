import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function WalletConnect() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkIfWalletConnected();
  }, []);

  const checkIfWalletConnected = async () => {
    try {
      const { solana } = window as any;
      if (solana?.isPhantom && solana.isConnected) {
        const response = await solana.connect({ onlyIfTrusted: true });
        setWalletAddress(response.publicKey.toString());
      }
    } catch (error) {
      console.log('Wallet not connected');
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      const { solana } = window as any;

      if (!solana?.isPhantom) {
        toast({
          title: "Phantom Wallet Not Found",
          description: "Please install Phantom wallet extension to connect.",
          variant: "destructive",
        });
        window.open('https://phantom.app/', '_blank');
        return;
      }

      const response = await solana.connect();
      const address = response.publicKey.toString();
      setWalletAddress(address);

      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 4)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      const { solana } = window as any;
      if (solana) {
        await solana.disconnect();
        setWalletAddress(null);
        toast({
          title: "Wallet Disconnected",
          description: "Your wallet has been disconnected.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Disconnection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (walletAddress) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-2 px-3 py-1.5" data-testid="badge-wallet-connected">
          <Circle className="w-2 h-2 fill-success-green text-success-green" />
          <span className="font-mono text-sm">
            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
          </span>
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnectWallet}
          data-testid="button-disconnect-wallet"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
      className="gap-2"
      data-testid="button-connect-wallet"
    >
      <Wallet className="w-4 h-4" />
      {isConnecting ? "Connecting..." : "Connect Phantom"}
    </Button>
  );
}

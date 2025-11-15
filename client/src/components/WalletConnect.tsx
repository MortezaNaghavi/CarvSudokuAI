import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletConnect() {
  return (
    <WalletMultiButton
      style={{
        fontWeight: "600",
        paddingInline: "1rem",
        paddingBlock: "0.5rem",
        borderRadius: "9999px",
        fontSize: "0.875rem",
      }}
    />
  );
}

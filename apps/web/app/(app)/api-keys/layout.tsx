import { ApiKeysProvider } from "@/components/app/api-keys/api-keys-provider";

export default function ApiKeysLayout({ children }: LayoutProps<"/api-keys">) {
  return <ApiKeysProvider>{children}</ApiKeysProvider>;
}

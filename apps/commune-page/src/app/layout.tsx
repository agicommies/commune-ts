import "../styles/globals.css";

import type { Metadata } from "next";

import { Providers } from "@commune-ts/providers/context";
import { links } from "@commune-ts/ui/data";
import { cairo } from "@commune-ts/ui/fonts";
import { Footer } from "@commune-ts/ui/footer";
import { Header } from "@commune-ts/ui/header";
import { WalletButton, Wallet } from "@commune-ts/wallet";

export const metadata: Metadata = {
  robots: "all",
  title: "Commune AI",
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "Making decentralized AI for everyone",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body
        className={`relative bg-gray-950 bg-[url('/bg-pattern.svg')] ${cairo.className} animate-fade-in`}
      >
        <Providers>
          <Wallet />
          <Header
            logoSrc="/logo.svg"
            navigationLinks={[
              { name: "Governance", href: links.governance, external: true },
              { name: "Docs", href: links.docs, external: false },
              { name: "Blog", href: links.blog, external: true },
              { name: "Join Community", href: links.discord, external: true },
            ]}
            title="Commune AI"
            wallet={<WalletButton />}
          />
          {children}
          <Footer shouldBeFixed className="md:hidden lg:block" />
        </Providers>
      </body>
    </html>
  );
}

import "../styles/globals.css";

import type { Metadata } from "next";

import { Providers } from "@commune-ts/providers/context";
import { links } from "@commune-ts/ui/data";
import { cairo } from "@commune-ts/ui/fonts";
import { Footer } from "@commune-ts/ui/footer";
import { Header } from "@commune-ts/ui/header";
import { WalletButton } from "@commune-ts/wallet/button";

// TODO this could come from the ui lib since the only thing that changes between apps is the title
export const metadata: Metadata = {
  robots: "all",
  title: "CommuneX",
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
        className={`bg-gray-950 bg-[url('/bg-pattern.svg')] ${cairo.className} animate-fade-in`}
      >
        <Providers>
          <Header
            logoSrc="/logo.svg"
            navigationLinks={[
              { name: "Home Page", href: links.landing_page, external: true },
            ]}
            title="CommuneX"
            wallet={<WalletButton />}
          />
          {children}
          <Footer shouldBeFixed />
        </Providers>
      </body>
    </html>
  );
}

import "../styles/globals.css";

import type { Metadata } from "next";

import { Providers } from "@commune-ts/providers/context";
import { WalletButtonWithHook } from "@commune-ts/providers/wallet-button-with-hook";
import { links } from "@commune-ts/ui/data";
import { cairo } from "@commune-ts/ui/fonts";
import { Footer } from "@commune-ts/ui/footer";
import { Header } from "@commune-ts/ui/header";

import { MobileHeaderContent } from "./components/mobile-header-content";
import ProposalRewardCard from "./components/proposal-reward-card";

// TODO this could come from the ui lib since the only thing that changes between apps is the title
export const metadata: Metadata = {
  robots: "all",
  title: "Community Governance",
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
        className={`bg-gray-950 bg-[url('/bg-pattern.svg')] ${cairo.className} animate-fade-in h-full`}
      >
        <Providers>
          <ProposalRewardCard />
          <Header
            logoSrc="/logo.svg"
            title="Community Governance"
            wallet={<WalletButtonWithHook />}
            mobileContent={<MobileHeaderContent />}
            navigationLinks={[
              { name: "Homepage", href: links.landing_page, external: true },
            ]}
          />
          {children}
          <Footer shouldBeFixed />
        </Providers>
      </body>
    </html>
  );
}

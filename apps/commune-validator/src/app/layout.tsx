import "../styles/globals.css";

import type { Metadata } from "next";
import Link from "next/link";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

import { Providers } from "@commune-ts/providers/context";
import { links } from "@commune-ts/ui/data";
import { cairo } from "@commune-ts/ui/fonts";
import { Footer } from "@commune-ts/ui/footer";
import { Header } from "@commune-ts/ui/header";
import { WalletButton } from "@commune-ts/wallet/button";

import { TRPCReactProvider } from "~/trpc/react";
import { DelegatedModulesList } from "./components/delegated-modules-list";

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
        className={`bg-gray-950 bg-[url('/bg-pattern.svg')] ${cairo.className} animate-fade-in`}
      >
        <Providers>
          <div className="flex w-full animate-fade-down border-b border-white/20 py-2.5">
            <div className="mx-auto flex max-w-screen-md items-center gap-1 px-2">
              <InformationCircleIcon className="h-10 w-10 text-green-500 md:h-5 md:w-5" />
              <p className="text-gray-400">
                To assign weights to modules, you need to stake on our
                validator. Click{" "}
                <Link href="" className="text-green-500 hover:underline">
                  here
                </Link>{" "}
                to get started.
              </p>
            </div>
          </div>
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
          <TRPCReactProvider>
            {children} <DelegatedModulesList />
          </TRPCReactProvider>
          <Footer shouldBeFixed />
        </Providers>
      </body>
    </html>
  );
}

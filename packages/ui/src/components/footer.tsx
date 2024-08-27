import Image from "next/image";
import Link from "next/link";

import {
  DiscordIcon,
  GithubIcon,
  TelegramIcon,
  XIcon,
} from "@commune-ts/public";

import { links } from "..";

export function Footer({ shouldBeFixed = false, className = "" }): JSX.Element {
  return (
    <footer
      className={`${shouldBeFixed && "fixed"} bottom-0 hidden w-full animate-fade-up border-t border-white/20 bg-[#898989]/5 backdrop-blur-md animate-delay-700 md:block ${className}`}
    >
      <div className="mx-auto max-w-screen-2xl">
        <div className="flex flex-col items-center justify-between gap-2 px-4 py-4 md:flex-row">
          <p className="hidden w-4/12 text-sm text-gray-400 lg:block">
            Making decentralized AI for everyone.
          </p>

          <div className="flex justify-center gap-6 md:w-4/12">
            {socialList.map((item) => (
              <Link
                className="text-subtitle leading-6 hover:text-gray-800 hover:underline"
                href={item.href}
                key={item.name}
              >
                {item.icon}
              </Link>
            ))}
          </div>

          <p className="flex justify-end text-sm text-gray-400 md:w-4/12">
            &copy; 2024 Commune, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}

const socialList = [
  {
    name: "Discord",
    href: links.discord,
    icon: <Image alt="Discord icon" height={26} src={DiscordIcon} width={26} />,
  },
  {
    name: "X",
    href: links.x,
    icon: <Image alt="X icon" height={22} src={XIcon} width={22} />,
  },
  {
    name: "GitHub",
    href: links.github,
    icon: <Image alt="Github icon" height={23} src={GithubIcon} width={23} />,
  },
  {
    name: "Telegram",
    href: links.telegram,
    icon: (
      <Image alt="Telegram icon" height={22} src={TelegramIcon} width={22} />
    ),
  },
];

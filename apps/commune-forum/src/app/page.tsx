import Link from "next/link";
import { Dropdown } from "./components/dropdown";
import { Filters } from "./components/filters";
import { LinkIcon } from "@heroicons/react/16/solid";
import Image from "next/image";
import { Modal } from "./components/modal";
import { CreatePost } from "./components/create-post";

const appsList = [
  {
    title: "Landing page",
    url: "#"
  },
  {
    title: "Wallet",
    url: "#"
  },
  {
    title: "Validator",
    url: "#"
  },
  {
    title: "Governance",
    url: "#"
  },
]


const postsList = [
  {
    title: "New post about weight copy",
    date: "12/09/2024",
    author: "5FLXfUN…ahjdcRu",
    href: "#"
  },
  {
    title: "New post about weight copy",
    date: "12/09/2024",
    author: "5FLXfUN…ahjdcRu",
    href: "#"
  },
  {
    title: "New post about weight copy",
    date: "12/09/2024",
    author: "5FLXfUN…ahjdcRu",
    href: "#"
  },
  {
    title: "New post about weight copy",
    date: "12/09/2024",
    author: "5FLXfUN…ahjdcRu",
    href: "#"
  },
]

function handlePercentages(
  favorablePercent: number | null,
): JSX.Element | null {
  if (favorablePercent === null) return null;

  const againstPercent = 100 - favorablePercent;
  if (Number.isNaN(favorablePercent)) {
    return (
      <div className="w-full px-3 text-center text-yellow-500 border py-2text-sm border-white/10 lg:w-auto">
        – %
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-full px-3 py-2 space-x-0 text-sm text-center border divide-x divide-white/10 border-white/10 lg:w-auto">
      <div className="flex gap-1 pr-1.5">
        <span className="text-green-500">{favorablePercent.toFixed(0)}%</span>
        <Image
          alt="favorable arrow up icon"
          height={14}
          src="/favorable-up.svg"
          width={10}
        />
      </div>
      <div className="flex gap-1 pl-1.5">
        {/* <span className="text-gray-500">{" | "}</span> */}
        <span className="text-red-500"> {againstPercent.toFixed(0)}% </span>
        <Image
          alt="against arrow down icon"
          height={14}
          src="/against-down.svg"
          width={10}
        />
      </div>
    </div>
  );
}

export default function HomePage(): JSX.Element {
  const dropdownActionsList = [
    {
      title: "Forum post",
      handle: () => null
    },
    {
      title: "External post",
      handle: () => null
    },
  ]

  return (
    <main className="flex w-full flex-col items-center justify-start min-h-[calc(100vh-123px)] h-full bg-repeat mx-auto  max-w-screen-2xl animate-fade-in-down px-20 text-white divide-y divide-white/10">

      <div className="flex flex-col w-full pt-20 pb-12">
        <h3 className="text-base text-gray-500 border max-w-fit px-2 py-0.5 border-white/20 bg-[#898989]/5 mb-3">Welcome to the Community Forum</h3>
        <h2 className="text-4xl font-medium">Interact with posts and ideas made by the <span className="text-green-500">community</span>.</h2>
      </div>
      <div className="flex flex-row items-center justify-between w-full py-8">
        <Filters />
        <Dropdown
          actionsList={dropdownActionsList}
          title={"Create"}
        />
      </div>

      {/* Posts list */}
      <div className="flex flex-col w-full gap-4 pt-10 pb-20">
        {postsList.map((post, index) => {
          return (
            <div key={index} className="border p-3 border-white/20 bg-[#898989]/5 flex w-full items-center justify-between">
              <div className="flex items-start justify-center ml-2 divide-x divide-white/20">
                <h4 className="max-w-lg pr-4 truncate">{post.title}</h4>
                <p className="px-4">
                  <span className="mr-1.5 text-green-500">Date:</span>
                  12/09/2024
                </p>
                <p className="px-4">
                  <span className="mr-1.5 text-green-500">Author:</span>
                  5FLXfUN…ahjdcRu
                </p>
                <div className="px-4">
                  <span className="px-3 text-xs text-yellow-500 border border-yellow-500 rounded-full bg-yellow-500/5">
                    OFF-TOPIC
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                {handlePercentages(10)}
                <button
                  // onClick={() => console.log("copiou")}
                  className="flex items-center px-3 py-2 border border-white/20 bg-white/5 hover:border-green-500 hover:cursor-pointer hover:text-green-500"
                >
                  <LinkIcon color="#FFF" height={18} />
                </button>
                <Link
                  className="flex items-center px-3 py-2 border border-white/20 bg-white/5 hover:border-green-500 hover:cursor-pointer hover:text-green-500"
                  href="/post/123">View More
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-row items-end justify-between w-full pt-20 pb-12">
        <div>
          <h3 className="mb-3 text-base text-gray-500 max-w-fit">Want to engage in the community?</h3>
          <h2 className="text-4xl font-medium">Try our <span className="text-green-500">apps</span></h2>
        </div>
        <div className="flex items-center gap-4">
          {appsList.map((app) => {
            return (
              <Link className="items-center justify-center px-5 py-2.5 border h-fit bg-white/5 border-white/20 hover:border-green-500 hover:cursor-pointer hover:text-green-500" href={app.url} >{app.title}</Link>
            )
          })}
        </div>
      </div>
      <Modal title="New post" modalOpen>
        <CreatePost></CreatePost>
      </Modal>
    </main >
  );
}

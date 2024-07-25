import { useContext } from "react";
import { cn } from "..";

interface TestProps {
  hook(): unknown
}


export function Test(props: TestProps) {
  const { hook } = props
  const { balance, isBalanceLoading } = hook()
  return (
    <div className="bg-black text-white z-50 p-10 fixed top-0 border border-gray-500">
      <h1 className=''>
        Teste
        {isBalanceLoading}
        {balance}

      </h1>
    </div>
  );
}

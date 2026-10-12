import { Brand } from "./Header";
import lockIcon from "../assets/icons/lock.svg";

export default function CheckoutHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-18.5 max-w-300 items-center justify-between px-4 xl:px-0">
        <Brand />
        <span className="flex items-center gap-2 text-sm leading-[1.2] font-semibold text-muted">
          <img src={lockIcon} alt="" width={18} height={18} />
          Secure checkout
        </span>
      </div>
    </header>
  );
}

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

const buttonClassName =
  "group inline-flex items-center gap-2.5 rounded-sm bg-charcoal px-9 py-4 font-sans text-base font-semibold tracking-[1px] text-cream uppercase shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-coral hover:text-charcoal hover:shadow-lg active:translate-y-0";

type LinkButtonProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">;

type NativeButtonProps = {
  href?: undefined;
  className?: string;
  children: React.ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

type ButtonProps = LinkButtonProps | NativeButtonProps;

export default function Button({ className = "", children, ...rest }: ButtonProps) {
  if (rest.href) {
    return (
      <Link href={rest.href} className={`${buttonClassName} ${className}`}>
        {children}
        <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
          →
        </span>
      </Link>
    );
  }

  return (
    <button
      className={`${buttonClassName} ${className}`}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
      <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
        →
      </span>
    </button>
  );
}

import Image from "next/image";
import Link from "next/link";

interface ImageIconProps {
  src: string;
  href?: string;
  className?: string;
  alt?: string;
}

export function ImageIcon(props: ImageIconProps) {
  return (
    <Link href={props.href ?? ""}>
      <Image
        alt={props.alt ?? "Icon"}
        src={props.src}
        width={100}
        height={100}
        className={props.className}
      />
    </Link>
  );
}

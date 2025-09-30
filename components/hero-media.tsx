import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeroMediaProps {
  imageSrc: string;
  imageAlt: string;
  className?: string;
  priority?: boolean;
}

export function HeroMedia({ imageSrc, imageAlt, className, priority = false }: HeroMediaProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 shadow-2xl">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
          priority={priority}
          quality={85}
          loading={priority ? "eager" : "lazy"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
          unoptimized={imageSrc.endsWith('.svg')}
        />
      </div>
    </div>
  );
}

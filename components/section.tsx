import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "xl";
}

export function Section({ children, className, padding = "lg" }: SectionProps) {
  const paddingClasses = {
    sm: "py-12 sm:py-16",
    md: "py-16 sm:py-24",
    lg: "py-20 sm:py-32 lg:py-40",
    xl: "py-24 sm:py-40 lg:py-48"
  };

  return (
    <section className={cn(paddingClasses[padding], "relative", className)}>
      {children}
    </section>
  );
}

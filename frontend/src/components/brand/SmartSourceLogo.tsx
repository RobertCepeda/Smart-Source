import { cn } from "../../lib/utils";

type SmartSourceLogoProps = {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
};

const fullLogoSize = {
  sm: "h-8",
  md: "h-10",
  lg: "h-16",
};

const markSize = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

export function SmartSourceLogo({
  className,
  showText = true,
  size = "md",
  tone = "dark",
}: SmartSourceLogoProps) {
  const src = showText ? "/brand/smart-source-logo.png" : "/brand/smart-source-mark.png";
  const imageClassName = showText ? fullLogoSize[size] : markSize[size];

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center",
        tone === "light" ? "rounded-lg bg-white px-2.5 py-1.5 shadow-sm" : "",
        className,
      )}
    >
      <img
        src={src}
        alt="Smart Source"
        className={cn("block w-auto object-contain", imageClassName)}
        draggable={false}
      />
    </div>
  );
}

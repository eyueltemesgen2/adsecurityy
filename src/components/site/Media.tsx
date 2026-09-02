import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  loading?: "lazy" | "eager";
};

/** Image with a neutral technical placeholder when no media has been uploaded yet. */
export function MediaImage({ src, alt, className, imgClassName, loading = "lazy" }: Props) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-secondary text-muted-foreground",
          className,
        )}
        aria-label={alt}
        role="img"
      >
        <Camera className="h-8 w-8 opacity-40" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <div className={cn("overflow-hidden bg-secondary", className)}>
      <img src={src} alt={alt} loading={loading} className={cn("h-full w-full object-cover", imgClassName)} />
    </div>
  );
}

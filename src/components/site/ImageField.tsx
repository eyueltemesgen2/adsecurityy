import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/media.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export function ImageField({
  value,
  values,
  folder,
  multiple,
  onChange,
  onChangeMany,
}: {
  value?: string;
  values?: string[];
  folder?: string;
  multiple?: boolean;
  onChange?: (url: string) => void;
  onChangeMany?: (urls: string[]) => void;
}) {
  const upload = useServerFn(uploadImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const list = values ?? [];

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const base64 = await fileToBase64(file);
        const result = await upload({
          data: { filename: file.name, contentType: file.type, base64, folder: folder ?? "general" },
        });
        uploaded.push(result.url);
      }
      if (multiple) onChangeMany?.([...list, ...uploaded]);
      else onChange?.(uploaded[0] ?? "");
      toast.success("Image uploaded");
    } catch (error) {
      toast.error((error as Error).message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {multiple ? null : (
          <Input
            value={value ?? ""}
            placeholder="Image URL or upload"
            onChange={(event) => onChange?.(event.target.value)}
          />
        )}
        <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>
      {multiple ? (
        list.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {list.map((url) => (
              <li key={url} className="relative">
                <img src={url} alt="" className="h-16 w-16 border border-border object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => onChangeMany?.(list.filter((item) => item !== url))}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No images yet.</p>
        )
      ) : value ? (
        <img src={value} alt="" className="h-20 w-20 border border-border object-cover" />
      ) : null}
    </div>
  );
}

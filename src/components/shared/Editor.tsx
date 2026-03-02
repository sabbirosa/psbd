import { cn } from "@/lib/utils";
import { TextEditor } from "../text-editor";

type EditorProps = {
  className?: string;
};

export default function Editor({ className }: EditorProps) {
  return (
    <div className={cn("h-full w-full overflow-hidden", className)}>
      <TextEditor className="h-full" />
    </div>
  );
}

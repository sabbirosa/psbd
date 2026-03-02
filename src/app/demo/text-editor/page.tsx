import Editor from "@/components/shared/Editor";

export default function TextEditorPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Rich Text Editor Demo
          </h1>
          <p className="text-sm text-muted-foreground">
            This page showcases the reusable Editor.js-based editor. Use{" "}
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px] font-mono">
              +
            </kbd>{" "}
            on the left to add blocks like headings, images, checklists, embeds,
            and more.
          </p>
        </div>

        <div className="h-[480px]">
          <Editor />
        </div>
      </main>
    </div>
  );
}


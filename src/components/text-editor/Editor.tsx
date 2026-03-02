"use client";

import type EditorJS from "@editorjs/editorjs";
import type { OutputData } from "@editorjs/editorjs";
import * as React from "react";

import { cn } from "@/lib/utils";

import styles from "./editor.module.css";

export type TextEditorProps = {
  value?: OutputData;
  onChange?: (data: OutputData) => void;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  className?: string;
  /**
   * If you need to hard-reset the editor (e.g. switching between posts),
   * change this key to force a full re-mount.
   */
  resetKey?: string | number;
};

export function TextEditor({
  value,
  onChange,
  placeholder = "Write something…",
  readOnly = false,
  autoFocus = false,
  className,
  resetKey,
}: TextEditorProps) {
  const holderRef = React.useRef<HTMLDivElement | null>(null);
  const editorRef = React.useRef<EditorJS | null>(null);

  const onChangeRef = React.useRef<TextEditorProps["onChange"]>(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastRenderedRef = React.useRef<string | null>(null);
  const saveTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!holderRef.current) return;

    let cancelled = false;

    async function init() {
      const [{ default: Editor }, { default: Header }, { default: List }] =
        await Promise.all([
          import("@editorjs/editorjs"),
          import("@editorjs/header"),
          import("@editorjs/list"),
        ]);

      const [
        { default: Embed },
        { default: Raw },
        { default: SimpleImage },
        { default: ImageTool },
        { default: LinkTool },
      ] = await Promise.all([
        import("@editorjs/embed"),
        import("@editorjs/raw"),
        import("@editorjs/simple-image"),
        import("@editorjs/image"),
        import("@editorjs/link"),
      ]);

      const [
        { default: Checklist },
        { default: Quote },
        { default: Delimiter },
        { default: Marker },
        { default: InlineCode },
      ] = await Promise.all([
        import("@editorjs/checklist"),
        import("@editorjs/quote"),
        import("@editorjs/delimiter"),
        import("@editorjs/marker"),
        import("@editorjs/inline-code"),
      ]);

      if (cancelled || !holderRef.current) return;

      const initialData = value;
      lastRenderedRef.current = initialData
        ? JSON.stringify(initialData)
        : null;

      const editor = new Editor({
        holder: holderRef.current,
        autofocus: autoFocus,
        readOnly,
        placeholder,
        data: initialData,
        tools: {
          header: {
            class: Header as unknown as never,
            inlineToolbar: true,
            config: {
              levels: [2, 3, 4],
              defaultLevel: 2,
            },
          },
          embed: {
            class: Embed as unknown as never,
            inlineToolbar: false,
          },
          linkTool: {
            class: LinkTool as unknown as never,
            config: {
              endpoint: "/api/editorjs/link",
            },
          },
          raw: {
            class: Raw as unknown as never,
          },
          list: {
            class: List as unknown as never,
            inlineToolbar: true,
          },
          checklist: {
            class: Checklist as unknown as never,
            inlineToolbar: true,
          },
          simpleImage: {
            class: SimpleImage as unknown as never,
          },
          image: {
            class: ImageTool as unknown as never,
            config: {
              uploader: {
                uploadByFile: (file: File) =>
                  new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      resolve({
                        success: 1,
                        file: { url: String(reader.result) },
                      });
                    };
                    reader.onerror = () => reject(reader.error);
                    reader.readAsDataURL(file);
                  }),
                uploadByUrl: async (url: string) => ({
                  success: 1,
                  file: { url },
                }),
              },
            },
          },
          quote: {
            class: Quote as unknown as never,
            inlineToolbar: true,
            config: {
              quotePlaceholder: "Quote",
              captionPlaceholder: "Author",
            },
          },
          delimiter: Delimiter as unknown as never,
          marker: Marker as unknown as never,
          inlineCode: InlineCode as unknown as never,
        },
        onChange: () => {
          const cb = onChangeRef.current;
          if (!cb) return;

          if (saveTimeoutRef.current) {
            window.clearTimeout(saveTimeoutRef.current);
          }

          saveTimeoutRef.current = window.setTimeout(async () => {
            try {
              const data = await editor.save();
              lastRenderedRef.current = JSON.stringify(data);
              cb(data);
            } catch {
              // ignore save errors (e.g. unmount race)
            }
          }, 250);
        },
      });

      editorRef.current = editor;
    }

    void init();

    return () => {
      cancelled = true;
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      editorRef.current?.destroy?.();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, placeholder, readOnly, resetKey]);

  React.useEffect(() => {
    if (!value) return;
    const editor = editorRef.current;
    if (!editor) return;

    const next = JSON.stringify(value);
    if (lastRenderedRef.current === next) return;

    // EditorJS's render() is the safest way to update content.
    // (This will reset selection, so it's best used when switching between posts.)
    void editor
      .render(value)
      .then(() => {
        lastRenderedRef.current = next;
      })
      .catch(() => {
        // ignore render errors
      });
  }, [value]);

  return (
    <div
      className={cn(
        "rounded-lg border bg-background text-foreground shadow-sm",
        styles.root,
        className,
      )}
    >
      <div ref={holderRef} className="min-h-[240px] px-3 py-2" />
    </div>
  );
}

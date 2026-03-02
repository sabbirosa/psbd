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
  const keyHandlerRef = React.useRef<((event: KeyboardEvent) => void) | null>(
    null,
  );

  const onChangeRef = React.useRef<TextEditorProps["onChange"]>(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const lastRenderedRef = React.useRef<string | null>(null);
  const saveTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!holderRef.current) return;

    let cancelled = false;
    let instance: EditorJS | null = null;

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

      // Custom keyboard behaviour: mimic Notion-like empty-block handling.
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
          return;
        }

        const api = editor as unknown as {
          blocks?: {
            getCurrentBlockIndex: () => number;
            getBlocksCount: () => number;
            getBlockByIndex: (index: number) => { holder?: HTMLElement } | null;
            delete: (index: number) => void;
          };
          caret?: {
            setToBlock: (index: number, position?: "end" | "start") => void;
          };
        };

        if (!api.blocks) return;

        const index = api.blocks.getCurrentBlockIndex();
        const block = api.blocks.getBlockByIndex(index);
        const holder = block?.holder;

        if (!holder) return;

        const text = holder.innerText.replace(/\u200B/g, "").trim();

        // If there is content, let Editor.js handle Enter normally
        if (text.length > 0) return;

        event.preventDefault();

        const total = api.blocks.getBlocksCount();

        // If this is an extra empty block, remove it and move caret to previous
        if (total > 1) {
          api.blocks.delete(index);
          if (api.caret) {
            const target = Math.max(0, index - 1);
            try {
              api.caret.setToBlock(target, "end");
            } catch {
              // ignore caret errors
            }
          }
        }
      };

      (editor as any).listeners?.on?.(
        holderRef.current,
        "keydown",
        handleKeyDown as any,
      );

      keyHandlerRef.current = handleKeyDown;
      instance = editor;
      editorRef.current = editor;
    }

    void init();

    return () => {
      cancelled = true;
      if (instance && keyHandlerRef.current && holderRef.current) {
        (instance as any).listeners?.off?.(
          holderRef.current,
          "keydown",
          keyHandlerRef.current as any,
        );
      }
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
        "flex min-h-[240px] rounded-lg border bg-background text-foreground shadow-sm",
        styles.root,
        className,
      )}
    >
      <div
        ref={holderRef}
        className="min-h-[240px] flex-1 overflow-y-auto px-3 py-2"
      />
    </div>
  );
}

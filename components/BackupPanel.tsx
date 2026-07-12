"use client";

import { Download, Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { localStorageBookshelfRepository } from "@/repositories/localStorageBookshelfRepository";
import type { BookshelfData } from "@/types/book";
import { exportBookshelfData, parseBackupData } from "@/utils/backup";
import { Notice } from "@/components/Notice";

type BackupPanelProps = {
  data: BookshelfData;
  onRestore: (data: BookshelfData) => void;
};

export function BackupPanel({ data, onRestore }: BackupPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function exportJson() {
    const blob = new Blob([exportBookshelfData(data)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `book-compass-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("バックアップファイルを作成しました。");
    setError("");
  }

  async function restoreJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const confirmed = window.confirm(
      "現在の本棚データをバックアップ内容で上書きします。よろしいですか？"
    );
    if (!confirmed) {
      return;
    }

    try {
      const restored = parseBackupData(await file.text());
      const result = localStorageBookshelfRepository.replace(restored);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onRestore(restored);
      setMessage("バックアップから復元しました。");
      setError("");
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "バックアップを読み込めませんでした。"
      );
      setMessage("");
    }
  }

  return (
    <section className="surface grid gap-4 p-4 sm:p-5">
      <div>
        <h2 className="text-xl font-bold">保存・バックアップ</h2>
        <p className="mt-1 text-sm text-muted">
          本棚データはこのブラウザのlocalStorageに保存されます。
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" className="btn-secondary" onClick={exportJson}>
          <Download size={18} aria-hidden="true" />
          JSONでエクスポート
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={18} aria-hidden="true" />
          JSONから復元
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={restoreJson}
        />
      </div>
      {message ? <Notice message={message} tone="success" /> : null}
      {error ? <Notice message={error} tone="error" /> : null}
    </section>
  );
}

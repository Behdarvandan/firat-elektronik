"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { importExcelAction } from "./actions";

type ImportStatus = "idle" | "loading" | "success" | "error";

interface ImportResult {
  productsInserted?: number;
  modelsInserted?: number;
  errors?: string[];
  warnings?: string[];
}

export default function ExcelImportClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);

  // Seçilen / bırakılan dosyayı sunucu aksiyonuna gönderir.
  async function handleFile(file: File) {
    // İstemci tarafı hızlı doğrulama (sunucu tekrar doğrular)
    const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
    if (![".xlsx", ".xls"].includes(ext)) {
      setStatus("error");
      setError("Geçersiz dosya türü. Lütfen .xlsx veya .xls yükleyin.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus("error");
      setError("Dosya 10MB sınırını aşıyor.");
      return;
    }

    setFileName(file.name);
    setStatus("loading");
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await importExcelAction(formData);

    if (res.success) {
      setStatus("success");
      setResult(res);
    } else {
      setStatus("error");
      setError(res.error ?? "Yükleme başarısız oldu.");
      setResult({ errors: res.errors, warnings: res.warnings });
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function reset() {
    setStatus("idle");
    setFileName("");
    setError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      {/* Dosya bırakma alanı */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-700 bg-slate-900 hover:border-slate-600"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={onInputChange}
        />
        <svg
          className="mx-auto h-12 w-12 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="mt-4 text-lg font-semibold text-white">
          Excel dosyanızı sürükleyip bırakın
        </p>
        <p className="mt-1 text-sm text-slate-400">
          veya{" "}
          <span className="text-blue-400 font-medium">
            dosya seçmek için tıklayın
          </span>{" "}
          (.xlsx / .xls)
        </p>
      </div>

      {/* Yükleme durumu */}
      {status === "loading" && (
        <div className="flex items-center gap-3 rounded-xl bg-slate-900 border border-slate-800 p-4">
          <svg className="h-5 w-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-300">
            <span className="font-medium text-white">{fileName}</span> ayrıştırılıyor ve yükleniyor...
          </p>
        </div>
      )}

      {/* Hata */}
      {status === "error" && (
        <div className="rounded-xl bg-red-950/40 border border-red-900 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-red-300">Yükleme başarısız</p>
              <p className="text-sm text-red-200/80 mt-1">{error}</p>
              <button onClick={reset} className="mt-3 text-sm text-red-300 underline hover:text-red-200">
                Başka dosya seç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Başarı */}
      {status === "success" && result && (
        <div className="rounded-xl bg-green-950/40 border border-green-900 p-5">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-green-300">Yükleme tamamlandı</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <span className="text-green-200">
                  <strong>{result.productsInserted ?? 0}</strong> ürün
                </span>
                <span className="text-green-200">
                  <strong>{result.modelsInserted ?? 0}</strong> model
                </span>
              </div>

              {(result.warnings?.length ?? 0) > 0 && (
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer text-amber-300">
                    {result.warnings!.length} uyarı göster
                  </summary>
                  <ul className="mt-2 space-y-1 text-amber-200/80 list-disc list-inside">
                    {result.warnings!.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </details>
              )}

              {(result.errors?.length ?? 0) > 0 && (
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer text-orange-300">
                    {result.errors!.length} atlanan satır göster
                  </summary>
                  <ul className="mt-2 space-y-1 text-orange-200/80 list-disc list-inside max-h-48 overflow-y-auto">
                    {result.errors!.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </details>
              )}

              <button onClick={reset} className="mt-4 text-sm text-green-300 underline hover:text-green-200">
                Başka dosya yükle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

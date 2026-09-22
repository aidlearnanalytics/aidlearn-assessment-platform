"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";

const SAMPLE_JSON = `[
  {
    "prompt": "Which function allows dynamic two-way lookups across columns and rows in Excel?",
    "type": "MULTIPLE_CHOICE",
    "options": [
      { "id": "1", "text": "INDEX/MATCH", "isCorrect": true },
      { "id": "2", "text": "COUNTIF", "isCorrect": false },
      { "id": "3", "text": "SUMIFS", "isCorrect": false },
      { "id": "4", "text": "CONCATENATE", "isCorrect": false }
    ],
    "explanation": "INDEX with dual MATCH enables dynamic horizontal and vertical coordinate lookups.",
    "difficulty": "intermediate",
    "points": 2,
    "skillName": "Excel",
    "categoryName": "Lookup Functions"
  }
]`;

export default function BulkImporterForm() {
  const router = useRouter();
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array of question objects.");
      }

      let importedCount = 0;
      for (const item of parsed) {
        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (res.ok) importedCount++;
      }

      setSuccess(`Successfully imported ${importedCount} questions into Question Bank!`);
      setTimeout(() => {
        router.push("/admin/question-bank");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid JSON formatting.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(String(event.target?.result || ""));
    };
    reader.readAsText(file);
  }

  return (
    <form onSubmit={handleImport} className="flex flex-col gap-6 max-w-3xl">
      <div className="bg-white rounded-2xl border border-black/10 p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-black/70 uppercase tracking-wider">
            Upload or Paste JSON Questions Array
          </label>
          <label className="cursor-pointer text-xs font-semibold text-[#1d4ed8] hover:underline flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Upload .JSON File
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <textarea
          required
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={12}
          className="w-full rounded-xl border border-black/15 p-3.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
        />

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="self-start py-2.5 px-6 rounded-xl bg-[#1d4ed8] hover:bg-blue-700 text-white text-sm font-semibold shadow-sm disabled:opacity-60 transition-all cursor-pointer"
        >
          {loading ? "Importing..." : "Parse & Import Questions"}
        </button>
      </div>
    </form>
  );
}

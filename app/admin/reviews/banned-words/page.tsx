"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import AdminLayout from "@/components/AdminLayout";
import { Plus, Trash2, Shield, AlertTriangle } from "lucide-react";

type BannedWord = {
  id: string;
  word: string;
  is_regex: boolean;
  created_at: string;
};

export default function BannedWordsPage() {
  const [words, setWords] = useState<BannedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState("");
  const [isRegex, setIsRegex] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("review_banned_words")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setWords(data);
    setLoading(false);
  };

  const addWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    setAdding(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("review_banned_words")
      .insert({ word: newWord.trim(), is_regex: isRegex })
      .select()
      .single();

    if (data && !error) {
      setWords((prev) => [data, ...prev]);
      setNewWord("");
      setIsRegex(false);
    }
    setAdding(false);
  };

  const deleteWord = async (id: string) => {
    const supabase = createClient();
    await supabase.from("review_banned_words").delete().eq("id", id);
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a href="/admin/reviews" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">
            ← Back to Reviews
          </a>
          <h1 className="text-2xl font-bold text-gray-900">Banned Words & Phrases</h1>
          <p className="text-sm text-gray-500 mt-1">
            Words and patterns that are automatically blocked in reviews
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">How it works:</p>
            <ul className="mt-1 space-y-0.5 text-amber-700">
              <li>• Reviews containing these words/phrases will be rejected</li>
              <li>• Matching is case-insensitive</li>
              <li>• Use regex for advanced patterns (e.g., <code className="bg-amber-100 px-1 rounded">\d{'{'}10{'}'}</code> for 10-digit numbers)</li>
            </ul>
          </div>
        </div>

        {/* Add Form */}
        <form onSubmit={addWord} className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Banned Word/Phrase
          </h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Enter word, phrase, or regex pattern..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
              />
            </div>
            <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={isRegex}
                onChange={(e) => setIsRegex(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Regex</span>
            </label>
            <button
              type="submit"
              disabled={!newWord.trim() || adding}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        </form>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {words.length} banned word{words.length !== 1 ? "s" : ""}
            </span>
            <Shield className="w-4 h-4 text-gray-400" />
          </div>

          {words.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-sm">No banned words configured</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {words.map((word) => (
                <div
                  key={word.id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-800 font-mono">
                      {word.word}
                    </code>
                    {word.is_regex && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded uppercase">
                        Regex
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteWord(word.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Common Patterns */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Common patterns to add:</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { word: "http://", label: "HTTP links" },
              { word: "https://", label: "HTTPS links" },
              { word: "t.me/", label: "Telegram links" },
              { word: "wa.me/", label: "WhatsApp links" },
              { word: "@", label: "@ mentions" },
              { word: "\\d{8,}", label: "Phone numbers (8+ digits)", regex: true },
            ].map((pattern) => (
              <button
                key={pattern.word}
                onClick={() => {
                  setNewWord(pattern.word);
                  setIsRegex(pattern.regex || false);
                }}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-gray-300"
              >
                {pattern.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

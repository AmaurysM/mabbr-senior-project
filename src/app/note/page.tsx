"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, useRef } from "react";
import { FileTextIcon } from "lucide-react";
import { UserTransactions } from "@/lib/prisma_types";
import LoadingState from "../components/LoadingState";
import StockNotesList from "../components/NotesPage/StockNotesList";
import TransactionHeader from "../components/NotesPage/TransactionHeader";
import TransactionDetails from "../components/NotesPage/TransactionDetails";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import NoteSection from "../components/NotesPage/NoteSection";

const StockNotes = () => {
  const [transactions, setTransactions] = useState<UserTransactions>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [editingPublicNote, setEditingPublicNote] = useState(false);
  const [editingPrivateNote, setEditingPrivateNote] = useState(false);
  const [publicNoteText, setPublicNoteText] = useState("");
  const [privateNoteText, setPrivateNoteText] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const selectedTransaction = useMemo(() => {
    return transactions.find((t) => t.id === selectedTransactionId);
  }, [selectedTransactionId, transactions]);

  const handleSelectTransaction = useCallback((id: string) => {
    setSelectedTransactionId(id);
    setIsSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering handleClickOutside
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleSaveNote = async (type: "public" | "private", text: string) => {
    if (!selectedTransaction) return;

    try {
      setSaveLoading(true);
      const response = await fetch(`/api/user/note?id=${selectedTransaction.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [type === "public" ? "publicNote" : "privateNote"]: text
        }),
      });

      if (!response.ok) throw new Error("Failed to save note");

      // Update local state
      setTransactions(transactions.map(t => 
        t.id === selectedTransaction.id 
          ? { ...t, [type === "public" ? "publicNote" : "privateNote"]: text }
          : t
      ));

      // Reset editing state
      if (type === "public") {
        setEditingPublicNote(false);
      } else {
        setEditingPrivateNote(false);
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = useCallback(
    (type: "public" | "private") => {
      if (selectedTransaction) {
        if (type === "public") {
          setPublicNoteText(selectedTransaction.publicNote || "");
          setEditingPublicNote(false);
        } else {
          setPrivateNoteText(selectedTransaction.privateNote || "");
          setEditingPrivateNote(false);
        }
      }
    },
    [selectedTransaction]
  );

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/note");

        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const data: UserTransactions = await response.json();
        setTransactions(data);

        const firstWithNotes = data.find((t) => t.publicNote || t.privateNote);
        if (firstWithNotes) {
          setSelectedTransactionId(firstWithNotes.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    // Close sidebar if click is outside both sidebar and menu button
    if (
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target as Node) &&
      menuButtonRef.current &&
      !menuButtonRef.current.contains(event.target as Node)
    ) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isSidebarOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSidebarOpen, handleClickOutside]);

  useEffect(() => {
    if (selectedTransaction) {
      setPublicNoteText(selectedTransaction.publicNote || "");
      setPrivateNoteText(selectedTransaction.privateNote || "");
    }
    setEditingPublicNote(false);
    setEditingPrivateNote(false);
  }, [selectedTransaction]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><LoadingState /></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex h-full relative">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left sidebar - Transactions list */}
      <div
        ref={sidebarRef}
        className={`fixed lg:relative inset-y-0 left-0 w-64 lg:w-1/4 min-w-64 border-r border-white/10 overflow-y-auto bg-gray-800/50 backdrop-blur-sm z-50 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-4 border-b border-white/10 sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10 shadow-sm">
          <h1 className="text-xl font-bold text-white">Stock Notes</h1>
          <p className="text-sm text-gray-400">{transactions.length} Notes</p>
        </div>

        <StockNotesList
          transactions={transactions}
          selectedTransactionId={selectedTransactionId}
          setSelectedTransactionId={handleSelectTransaction}
          getNotePreview={(t) => t.publicNote || t.privateNote || ""}
        />
      </div>

      {/* Tab-style floating menu button */}
      <button
        ref={menuButtonRef}
        onClick={toggleSidebar}
        className={`lg:hidden fixed top-30 left-0 z-50 shadow-md transition-all duration-300 ${
          isSidebarOpen 
            ? "bg-gray-800 text-white translate-x-64" 
            : "bg-blue-600 text-white"
        } py-3 pl-2 pr-3 rounded-r-lg flex items-center justify-center`}
        aria-label={isSidebarOpen ? "Close notes list" : "Open notes list"}
        aria-expanded={isSidebarOpen}
      >
        {isSidebarOpen ? (
          <FaAngleLeft className="w-5 h-5" />
        ) : (
          <FaAngleRight className="w-5 h-5" />
        )}
      </button>

      {/* Right content area - Transaction details */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-900">
        {selectedTransaction ? (
          <div className="max-w-3xl mx-auto lg:mx-0 space-y-6">
            <TransactionDetails transaction={selectedTransaction} />
            
            <NoteSection
              title="Public Note"
              content={selectedTransaction.publicNote || ''}
              isEditing={editingPublicNote}
              onEdit={() => {
                setPublicNoteText(selectedTransaction.publicNote || '');
                setEditingPublicNote(true);
              }}
              onSave={(text) => handleSaveNote("public", text)}
              onCancel={() => setEditingPublicNote(false)}
            />

            <NoteSection
              title="Private Note"
              content={selectedTransaction.privateNote || ''}
              isEditing={editingPrivateNote}
              onEdit={() => {
                setPrivateNoteText(selectedTransaction.privateNote || '');
                setEditingPrivateNote(true);
              }}
              onSave={(text) => handleSaveNote("private", text)}
              onCancel={() => setEditingPrivateNote(false)}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/10 text-center">
              <FileTextIcon size={64} className="text-gray-600 mx-auto" />
              <p className="mt-4 text-lg text-gray-400">
                {transactions.length > 0 ? "Select a transaction to view notes" : "No notes available"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockNotes;
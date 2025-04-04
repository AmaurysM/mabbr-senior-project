"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy, useRef } from "react";
import { FileTextIcon } from "lucide-react";
import { UserTransactions } from "@/lib/prisma_types";
import LoadingStateAnimation from "../components/LoadingState";
import StockNotesList from "../components/NotesPage/StockNotesList";
import TransactionHeader from "../components/NotesPage/TransactionHeader";
import TransactionDetails from "../components/NotesPage/TransactionDetails";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

const NoteSection = lazy(() => import("../components/NotesPage/NoteSection"));

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

  const handleSaveNote = useCallback(async (type: "public" | "private") => {
    if (!selectedTransactionId) return;

    try {
      setSaveLoading(true);
      const updatedNote = type === "public"
        ? { publicNote: publicNoteText }
        : { privateNote: privateNoteText };

      const response = await fetch(`/api/user/note?id=${selectedTransactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedNote),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${type} note`);
      }

      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === selectedTransactionId
            ? { ...transaction, ...updatedNote }
            : transaction
        )
      );

      if (type === "public") {
        setEditingPublicNote(false);
      } else {
        setEditingPrivateNote(false);
      }
    } catch (err) {
      console.error(`Error updating ${type} note:`, err);
      alert(`Failed to save ${type} note. Please try again.`);
    } finally {
      setSaveLoading(false);
    }
  }, [selectedTransactionId, publicNoteText, privateNoteText]);

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
    return <div className="flex items-center justify-center h-full"><LoadingStateAnimation /></div>;
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
        className={`fixed lg:relative inset-y-0 left-0 w-64 lg:w-1/4 min-w-64 border-r overflow-y-auto bg-white z-50 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-4 border-b sticky top-0 bg-white z-10 shadow-sm">
          <h1 className="text-xl font-bold">Stock Notes</h1>
          <p className="text-sm text-gray-500">{transactions.length} Notes</p>
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
            ? "bg-white text-gray-800 translate-x-64" 
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
      <div className="flex-1 p-6 overflow-y-auto bg-gray-200">
        {selectedTransaction ? (
          <div className="max-w-3xl mx-auto lg:mx-0">
            <TransactionHeader transaction={selectedTransaction} />
            <TransactionDetails transaction={selectedTransaction} />

            {/* Public Note Section */}
            <Suspense fallback={<LoadingStateAnimation />}>
              <NoteSection
                title="Public Note"
                editing={editingPublicNote}
                text={publicNoteText}
                setText={setPublicNoteText}
                note={selectedTransaction.publicNote}
                onEdit={() => setEditingPublicNote(true)}
                onSave={() => handleSaveNote("public")}
                onCancel={() => handleCancelEdit("public")}
                saveLoading={saveLoading}
              />
            </Suspense>

            {/* Private Note Section */}
            <Suspense fallback={<></>}>
              <NoteSection
                title="Private Note"
                editing={editingPrivateNote}
                text={privateNoteText}
                setText={setPrivateNoteText}
                note={selectedTransaction.privateNote}
                onEdit={() => setEditingPrivateNote(true)}
                onSave={() => handleSaveNote("private")}
                onCancel={() => handleCancelEdit("private")}
                saveLoading={saveLoading}
              />
            </Suspense>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-lg shadow-lg">
            <FileTextIcon size={64} />
            <p className="mt-4 text-lg">
              {transactions.length > 0 ? "Select a transaction to view notes" : "No notes available"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockNotes;
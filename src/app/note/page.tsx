"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from "react";
import { FileTextIcon } from "lucide-react";
import { UserTransactions } from "@/lib/prisma_types";
import LoadingStateAnimation from "../components/LoadingState";
import StockNotesList from "../components/NotesPage/StockNotesList";
import TransactionHeader from "../components/NotesPage/TransactionHeader";
import TransactionDetails from "../components/NotesPage/TransactionDetails";

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

  const selectedTransaction = useMemo(() => {
    return transactions.find((t) => t.id === selectedTransactionId);
  }, [selectedTransactionId, transactions]);

  useEffect(() => {
    if (selectedTransaction) {
      setPublicNoteText(selectedTransaction.publicNote || "");
      setPrivateNoteText(selectedTransaction.privateNote || "");
    }
    setEditingPublicNote(false);
    setEditingPrivateNote(false);
  }, [selectedTransaction]);
  
  const handleSaveNote = useCallback(async (type: "public" | "private") => {
    if (!selectedTransactionId) return;
  
    try {
      setSaveLoading(true);
      const updatedNote = type === "public"
        ? { publicNote: publicNoteText }
        : { privateNote: privateNoteText };
  
      const response = await fetch(`/api/user/note/${selectedTransactionId}`, {
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

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><LoadingStateAnimation /></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Left sidebar - Transactions list */}
      <div className="w-1/4 min-w-64 border-r overflow-y-auto">
        <div className="p-4 border-b sticky top-0 bg-white z-10 shadow-sm">
          <h1 className="text-xl font-bold">Stock Notes</h1>
          <p className="text-sm text-gray-500">{transactions.length} Notes</p>
        </div>

        <StockNotesList
          transactions={transactions}
          selectedTransactionId={selectedTransactionId}
          setSelectedTransactionId={setSelectedTransactionId}
          getNotePreview={(t) => (t.publicNote || t.privateNote || "")}
        />
      </div>

      {/* Right content area - Transaction details */}
      <div className="w-3/4 p-6 overflow-y-auto bg-gray-200">
        {selectedTransaction ? (
          <div>
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

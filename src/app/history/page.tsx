"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { FileTextIcon } from "lucide-react";
import StockNotesList from "../components/NotesPage/StockNotesList";
import NoteSection from "../components/NotesPage/NoteSection";
import TransactionDetails from "../components/NotesPage/TransactionDetails";
import LoadingState from "../components/LoadingState";
import { useTransactions } from "@/hooks/useTransactions";
import { useFriendTransactions } from "@/hooks/useFriendTransactions"; // import the hook
import FriendsHistory from "./friendsList/FriendsHistory";
import { useStockInfo } from "@/hooks/useStockInfo";

const StockNotes = () => {
  const {
    transactions,
    setTransactions,
    loading,
    error,
  } = useTransactions();

  const {
    friendTransactions,
    loading: friendLoading,
    error: friendError,
  } = useFriendTransactions();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState({
    public: "",
    private: "",
  });

  const [editing, setEditing] = useState({
    public: false,
    private: false,
  });

  const [saving, setSaving] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const selectedTx = useMemo(() => {
    return transactions.find(t => t.id === selectedId) || friendTransactions.find(t => t.id === selectedId) || null;
  }, [transactions, selectedId]);
  
  const isFriendTx = useMemo(() => {
    return !!friendTransactions.find(t => t.id === selectedId);
  }, [friendTransactions, selectedId]);

  useEffect(() => {
    const firstWithNote = transactions.find(t => t.publicNote || t.privateNote);
    if (firstWithNote) setSelectedId(firstWithNote.id);
  }, [transactions]);

  useEffect(() => {
    if (selectedTx && !isFriendTx) {
      setNoteDrafts({
        public: selectedTx.publicNote || "",
        private: selectedTx.privateNote || "",
      });
      setEditing({ public: false, private: false });
    }
  }, [selectedTx, isFriendTx]);
  
  const { symbol, time } = useMemo(() => {
    return {
      symbol: selectedTx?.stockSymbol ?? null,
      time: selectedTx?.timestamp ?? null,
    };
  }, [selectedTx]);

  const {
    stockInfo,
    loading: stockInfoLoading,
    error: stockInfoError,
    refetch: refetchStockInfo
  } = useStockInfo(symbol, time ?? new Date());


  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target as Node) &&
      menuButtonRef.current &&
      !menuButtonRef.current.contains(event.target as Node)
    ) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [sidebarOpen, handleClickOutside]);

  const handleSave = async (type: "public" | "private") => {
    if (!selectedTx) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/user/note?id=${selectedTx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [type === "public" ? "publicNote" : "privateNote"]: noteDrafts[type],
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      setTransactions(prev =>
        prev.map(tx =>
          tx.id === selectedTx.id
            ? { ...tx, [type === "public" ? "publicNote" : "privateNote"]: noteDrafts[type] }
            : tx
        )
      );
      setEditing(prev => ({ ...prev, [type]: false }));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex h-full relative">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside
        ref={sidebarRef}
        className={`fixed lg:relative inset-y-0 left-0 w-64 lg:w-1/4 min-w-64 border-r border-white/10 overflow-y-auto bg-gray-800/50 backdrop-blur-sm z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-4 border-b border-white/10 sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10 shadow-sm">
          <h1 className="text-xl font-bold text-white">Stock Notes</h1>
          <p className="text-sm text-gray-400">{transactions.length} Notes</p>
        </div>
        <StockNotesList
          transactions={transactions}
          selectedTransactionId={selectedId}
          setSelectedTransactionId={(id) => {
            setSelectedId(id);
            setSidebarOpen(false);
          }}
          getNotePreview={(t) => t.publicNote || t.privateNote || ""}
        />
      </aside>

      <button
        ref={menuButtonRef}
        onClick={() => setSidebarOpen(p => !p)}
        className={`lg:hidden fixed top-30 left-0 z-50 shadow-md transition-all duration-300 ${sidebarOpen ? "bg-gray-800 text-white translate-x-64" : "bg-blue-600 text-white"
          } py-3 pl-2 pr-3 rounded-r-lg flex items-center justify-center`}
      >
        {sidebarOpen ? <FaAngleLeft /> : <FaAngleRight />}
      </button>

      <main className="flex-1 p-6 overflow-y-auto bg-gray-900">
        {selectedTx ? (
          <div className="max-w-3xl mx-auto lg:mx-0 space-y-6">
            <TransactionDetails transaction={selectedTx} />
            {["public", "private"].map((type) => (
              <NoteSection
              key={type}
              title={`${type.charAt(0).toUpperCase() + type.slice(1)} Note`}
              content={
                isFriendTx
                  ? selectedTx?.[`${type}Note` as "publicNote" | "privateNote"] || ""
                  : editing[type as "public" | "private"]
                    ? noteDrafts[type as "public" | "private"]
                    : selectedTx?.[`${type}Note` as "publicNote" | "privateNote"] || ""
              }
              isEditing={!isFriendTx && editing[type as "public" | "private"]}
              onEdit={() => {
                if (!isFriendTx) {
                  setEditing(prev => ({ ...prev, [type]: true }));
                }
              }}
              onSave={async (text) => {
                if (!isFriendTx) {
                  setNoteDrafts(prev => ({ ...prev, [type]: text }));
                  await handleSave(type as "public" | "private");
                }
              }}
              onCancel={() => {
                if (!isFriendTx) {
                  setEditing(prev => ({ ...prev, [type]: false }));
                }
              }}
              isfriends={isFriendTx}
            />
            
            ))}

          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-center">
            <div>
              <FileTextIcon className="mx-auto mb-4" size={48} />
              <p>No transaction selected.</p>
            </div>
          </div>
        )}
      </main>
      {/* Right Sidebar (Friend Transactions) */}
      <FriendsHistory setSelectedId={setSelectedId} />
      {/* <aside className="hidden xl:block xl:w-1/4 border-l border-white/10 bg-gray-800/50 backdrop-blur-sm overflow-y-auto text-red-">
        <div className="p-4 border-b border-white/10 sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10 shadow-sm">
          <h1 className="text-xl font-bold text-white">Friend Transactions</h1>
          <p className="text-sm text-gray-400">{friendTransactions.length} Items</p>
        </div>
        <div className="divide-y divide-white/10">
          {friendLoading ? (
            <div className="p-4 text-gray-400">Loading...</div>
          ) : friendError ? (
            <div className="p-4 text-red-500">{friendError}</div>
          ) : friendTransactions.length === 0 ? (
            <div className="p-4 text-gray-400">No friend transactions found.</div>
          ) : (
            friendTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 hover:bg-gray-700/30 transition cursor-pointer"
                onClick={() => setSelectedId(tx.id)}
              >
                <p className="text-white font-medium">{tx.stockSymbol}</p>
                <p className="text-sm text-gray-400">Amount: {tx.amount}</p>
                <p className="text-sm text-gray-400">{tx.publicNote || "No public note."}</p>
              </div>
            ))

          )}
        </div>
      </aside> */}
    </div>
  );
};

export default StockNotes;

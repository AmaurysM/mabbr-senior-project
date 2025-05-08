"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { FaAngleLeft, FaAngleRight, FaSearch, FaXbox } from "react-icons/fa";
import { FileTextIcon, TrendingUpIcon } from "lucide-react";
import StockNotesList from "../components/NotesPage/StockNotesList";
import NoteSection from "../components/NotesPage/NoteSection";
import TransactionDetails from "../components/NotesPage/TransactionDetails";
import LoadingState from "../components/LoadingState";
import { useTransactions } from "@/hooks/useTransactions";
import { useHoldings } from "@/hooks/useHoldings";
import { TransformedStockData } from "@/app/api/stocks/live/route";
import { authClient } from "@/lib/auth-client";
import dynamic from "next/dynamic";
import chartOptions from "./ChartOptions/chartOptions";

// Dynamically import Chart component to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SeriesData {
  name: string;
  type: string;
  data: any[];
}

const StockNotes = () => {
  const [period, setPeriod] = useState("1mo");
  const [interval, setInterval] = useState("1d");
  const [stockData, setStockData] = useState<TransformedStockData | null>(null);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [series, setSeries] = useState<SeriesData[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");
  
  // Use custom hooks for data fetching
  const {
    transactions,
    setTransactions,
    loading: tLoading,
    error: tError,
  } = useTransactions();

  const {
    holdings,
    loading: hLoading,
    error: hError
  } = useHoldings();

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"note" | "chart">("note");

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"notes" | "holdings">("notes");
  const [noteDrafts, setNoteDrafts] = useState({
    public: "",
    private: "",
  });
  const [editing, setEditing] = useState({
    public: false,
    private: false,
  });
  const [saving, setSaving] = useState(false);
  const [noteFilter, setNoteFilter] = useState("");
  const [holdingFilter, setHoldingFilter] = useState("");

  // Refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Find selected transaction
  const selectedTx = useMemo(() => {
    return transactions?.find(t => t.id === selectedId) || null;
  }, [transactions, selectedId]);

  // Find selected holding
  const selectedHx = useMemo(() => {
    return holdings?.find(t => t.id === selectedHoldingId) || null;
  }, [holdings, selectedHoldingId]);
  
  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!noteFilter) return transactions;
    
    return transactions?.filter(t => {
      const publicNote = (t.publicNote || "").toLowerCase();
      const privateNote = (t.privateNote || "").toLowerCase();
      const stockName = (t.stockSymbol || "").toLowerCase();
      const searchTerm = noteFilter.toLowerCase();
      
      return publicNote.includes(searchTerm) || 
             privateNote.includes(searchTerm) || 
             stockName.includes(searchTerm);
    });
  }, [transactions, noteFilter]);

  // Fetch stock chart data when selected holding changes
  useEffect(() => {
    const fetchStockData = async () => {
      if (!selectedHx?.stock?.name || viewMode !== "chart") return;
      
      setChartLoading(true);
      setChartError("");
      
      try {
        const response = await fetch(
          `/api/stocks/live?symbol=${selectedHx.stock.name}&period=${period}&interval=${interval}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.series || !Array.isArray(data.series)) {
          throw new Error("Invalid data format");
        }
        

        setSeries(
          data.series.map((series: any) => ({
            ...series,
            data: series.data.map((d: any) => ({
              x: d.x,
              y:
                series.type === "candlestick"
                  ? Array.isArray(d.y)
                    ? d.y.map(Number)
                    : []
                  : Number(d.y),
            })),
          }))
        );

        setStockData(data.transformedStockData);
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setChartError(err instanceof Error ? err.message : "Unknown error");
        setSeries([]);
      } finally {
        setChartLoading(false);
      }
    };

    fetchStockData();
  }, [selectedHx, period, interval, viewMode]);

  // Update notes when selected transaction changes
  useEffect(() => {
    if (selectedTx) {
      setNoteDrafts({
        public: selectedTx.publicNote || "",
        private: selectedTx.privateNote || "",
      });
      setEditing({ public: false, private: false });
    }
  }, [selectedTx]);

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

  // Set default selected transaction
  useEffect(() => {
    if (transactions?.length > 0 && !selectedId && !selectedHoldingId) {
      const firstWithNote = transactions.find(t => t.publicNote || t.privateNote);
      if (firstWithNote) {
        setSelectedId(firstWithNote.id);
        setViewMode("note");
      }
    }
  }, [transactions, selectedId, selectedHoldingId]);

  // Chart options
  

  // Save note
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

  const renderTimePeriodSelector = () => (
    <div className="flex space-x-2 mb-4">
      {["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y"].map((option) => (
        <button
          key={option}
          className={`px-3 py-1 rounded ${period === option ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          onClick={() => setPeriod(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );

  // Select a note and show note view
  const handleSelectNote = (id: string) => {
    setSelectedId(id);
    setSelectedHoldingId(null);
    setViewMode("note");
    setSidebarOpen(false);
  };

  // Select a holding and show chart view
  const handleSelectHolding = (id: string) => {
    setSelectedHoldingId(id);
    setSelectedId(null);
    setViewMode("chart");
    setSidebarOpen(false);
  };
  const Skeleton: React.FC<{ width?: string; height?: string; className?: string }> = ({
    width = "w-full",
    height = "h-4",
    className = "",
  }) => (
    <div
      className={`
        bg-gray-700 rounded
        ${width} ${height}
        animate-pulse
        ${className}
      `}
    />
  );
  if (tLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-900 p-6 gap-4 h-full">
        <div className="flex gap-4">
          <Skeleton width="w-72" height="h-full" /> {/* sidebar */}
          <Skeleton className="flex-1" height="h-96" /> {/* main pane */}
          <Skeleton width="w-72" height="h-full" /> {/* sidebar */}
        </div>
      </div>
    );
  }

  if (tError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-red-500">
          Error loading transactions: {tError}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      {/* Left sidebar - Notes and Holdings list */}
      <aside
        ref={sidebarRef}
        className={`fixed lg:relative inset-y-0 left-0 w-72 lg:w-1/4 min-w-64 border-r border-white/10 overflow-y-auto bg-gray-800/50 backdrop-blur-sm z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-white/10 sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10 shadow-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Stock Tracker</h1>

          </div>
          
          {/* Tab selector for Notes and Holdings */}
          {sidebarOpen && (
          <div className="flex mt-3 border border-white/10 rounded-lg overflow-hidden">
            <button
              className={`flex-1 py-2 text-center text-sm ${
                sidebarTab === 'notes' ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setSidebarTab('notes')}
            >
              <span className="flex items-center justify-center gap-1.5">
                <FileTextIcon size={14} /> Notes
              </span>
            </button>
            <button
              className={`flex-1 py-2 text-center text-sm ${
                sidebarTab === 'holdings' ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setSidebarTab('holdings')}
            >
              <span className="flex items-center justify-center gap-1.5">
                <TrendingUpIcon size={14} /> Holdings
              </span>
            </button>
          </div>)}
          
          {/* Notes filter - only shown when notes tab is active */}
          {sidebarTab === 'notes' && (
            <>
              <p className="text-sm text-gray-400 mt-2">
                {filteredTransactions?.length || 0} of {transactions?.length || 0} Notes
              </p>
              
              <div className="mt-2 relative">
                <input
                  type="text"
                  placeholder="Filter notes..."
                  value={noteFilter}
                  onChange={(e) => setNoteFilter(e.target.value)}
                  className="w-full bg-gray-700/50 text-white rounded px-3 py-2 pl-8 text-sm"
                />
                <FaSearch className="absolute left-2 top-3 text-gray-400 text-sm" />
                {noteFilter && (
                  <button
                    onClick={() => setNoteFilter("")}
                    className="absolute right-2 top-2 text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            </>
          )}
          
          {/* Holdings filter - only shown when holdings tab is active */}
          {sidebarTab === 'holdings' && (
            <>
              <p className="text-sm text-gray-400 mt-2">
                {holdings?.filter(h => h.quantity > 0).length || 0} Holdings
              </p>
              
              <div className="mt-2 relative">
                <input
                  type="text"
                  placeholder="Filter holdings..."
                  value={holdingFilter}
                  onChange={(e) => setHoldingFilter(e.target.value)}
                  className="w-full bg-gray-700/50 text-white rounded px-3 py-2 pl-8 text-sm"
                />
                <FaSearch className="absolute left-2 top-3 text-gray-400 text-sm" />
                {holdingFilter && (
                  <button
                    onClick={() => setHoldingFilter("")}
                    className="absolute right-2 top-2 text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Show Notes list when notes tab is active */}
        {sidebarTab === 'notes' && (
          filteredTransactions && filteredTransactions.length > 0 ? (
            <StockNotesList
              transactions={filteredTransactions}
              selectedTransactionId={selectedId}
              setSelectedTransactionId={handleSelectNote}
              getNotePreview={(t) => {
                const preview = t.publicNote || t.privateNote || "No notes";
                if (noteFilter && (t.publicNote || t.privateNote)) {
                  const filterLower = noteFilter.toLowerCase();
                  if (t.publicNote?.toLowerCase().includes(filterLower) || 
                      t.privateNote?.toLowerCase().includes(filterLower)) {
                    return preview;
                  }
                }
                return preview;
              }}
              highlightText={noteFilter}
            />
          ) : (
            <div className="p-4 text-gray-400">
              {transactions?.length > 0 
                ? "No notes match your filter." 
                : "No transactions found."}
            </div>
          )
        )}
        
        {/* Show Holdings list when holdings tab is active */}
        {sidebarTab === 'holdings' && (
          <div className="divide-y divide-white/10">
            {hLoading ? (
              <div className="p-4 text-gray-400">Loading holdings...</div>
            ) : hError ? (
              <div className="p-4 text-red-500">{hError}</div>
            ) : !holdings || holdings.filter(h => {
                // Filter by search term if any
                const matchesFilter = !holdingFilter || 
                  h.stock?.name?.toLowerCase().includes(holdingFilter.toLowerCase());
                return h.quantity > 0 && matchesFilter;
              }).length === 0 ? (
              <div className="p-4 text-gray-400">
                {holdings?.some(h => h.quantity > 0)
                  ? "No holdings match your filter."
                  : "No holdings found."}
              </div>
            ) : (
              holdings
                .filter(h => {
                  const matchesFilter = !holdingFilter || 
                    h.stock?.name?.toLowerCase().includes(holdingFilter.toLowerCase());
                  return h.quantity > 0 && matchesFilter;
                })
                .map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-4 hover:bg-gray-700/30 transition cursor-pointer ${
                      selectedHoldingId === tx.id ? "bg-gray-700/50 border-l-4 border-blue-500" : ""
                    }`}
                    onClick={() => {
                      handleSelectHolding(tx.id);
                      // On mobile, close the sidebar after selection
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                  >
                    <p className="text-white font-medium">{tx.stock?.name || "N/A"}</p>
                    <p className="text-sm text-gray-400">Shares: {tx.quantity.toFixed(2)}</p>
                    <p className="text-sm text-gray-400">
                      Price: ${tx.stock?.price?.toFixed(2) || "N/A"}
                    </p>
                    <p className="text-sm text-green-400">
                      Value: ${((tx.stock?.price || 0) * tx.quantity).toFixed(2)}
                    </p>
                  </div>
                ))
            )}
          </div>
        )}
      </aside>
  
      {/* Mobile sidebar toggle button */}
      <button
        ref={menuButtonRef}
        onClick={() => setSidebarOpen(p => !p)}
        className={`lg:hidden fixed top-15 left-0 z-50 shadow-md transition-all duration-300 ${
          sidebarOpen ? "bg-gray-800 text-white translate-x-72" : "bg-blue-600 text-white"
        } py-3 pl-2 pr-3 rounded-r-lg flex items-center justify-center`}
      >
        {sidebarOpen ? <FaAngleLeft /> : <FaAngleRight />}
      </button>
  
      {/* Main content area */}
      <main className="flex-1 p-6 overflow-y-auto bg-gray-900 min-h-full">
        {/* Note View */}
        {viewMode === "note" && selectedTx ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <TransactionDetails transaction={selectedTx} />
            
            {["public", "private"].map((type) => (
              <NoteSection
                key={type}
                title={`${type.charAt(0).toUpperCase() + type.slice(1)} Note`}
                content={
                  editing[type as "public" | "private"]
                    ? noteDrafts[type as "public" | "private"]
                    : selectedTx[`${type}Note` as "publicNote" | "privateNote"] || ""
                }
                isEditing={editing[type as "public" | "private"]}
                onEdit={() => {
                  setEditing(prev => ({ ...prev, [type]: true }));
                }}
                onSave={async (text) => {
                  setNoteDrafts(prev => ({ ...prev, [type]: text }));
                  await handleSave(type as "public" | "private");
                }}
                onCancel={() => {
                  setEditing(prev => ({ ...prev, [type]: false }));
                  setNoteDrafts(prev => ({
                    ...prev,
                    [type]: selectedTx[`${type}Note` as "publicNote" | "privateNote"] || ""
                  }));
                }}
              />
            ))}
          </div>
        ) : 
        /* Chart View */
        viewMode === "chart" && selectedHx ? (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <h2 className="text-xl font-bold text-white">
                {selectedHx.stock?.name || "Stock"} Chart
              </h2>
              {renderTimePeriodSelector()}
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
              {chartLoading ? (
                <div className="h-full flex items-center justify-center">
                  <LoadingState  />
                </div>
              ) : chartError ? (
                <div className="h-full flex items-center justify-center text-red-500">
                  {chartError}
                </div>
              ) : series.length > 0 ? (
                <Chart 
                  options={chartOptions} 
                  series={series} 
                  type="line" 
                  height={460} 
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No chart data available
                </div>
              )}
            </div>
            
            {stockData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-gray-400 text-sm">Current Price</h3>
                  <p className="text-2xl font-bold text-white">
                    ${stockData.regularMarketPrice?.toFixed(2) || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-gray-400 text-sm">Change</h3>
                  <p className={`text-2xl font-bold ${
                    (stockData.regularMarketChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {stockData.regularMarketChangePercent ? 
                      stockData.regularMarketChangePercent.toFixed(2) + '%' : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-gray-400 text-sm">Your Position</h3>
                  <p className="text-2xl font-bold text-white">
                    {selectedHx.quantity.toFixed(2)} shares
                  </p>
                  <p className="text-sm text-green-400">
                    Value: ${((stockData.regularMarketPrice || 0) * selectedHx.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
            
            {/* Additional stock info */}
            {stockData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-gray-400 text-sm">Volume</h3>
                  <p className="text-lg font-bold text-white">
                    {stockData.regularMarketVolume?.toLocaleString() || "N/A"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Avg: {stockData.averageVolume?.toLocaleString() || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-gray-400 text-sm">Range (Today)</h3>
                  <p className="text-lg font-bold text-white">
                    ${stockData.regularMarketDayLow?.toFixed(2) || "N/A"} - ${stockData.regularMarketDayHigh?.toFixed(2) || "N/A"}
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-gray-400 text-sm">52-Week Range</h3>
                  <p className="text-lg font-bold text-white">
                    ${stockData.fiftyTwoWeekLow?.toFixed(2) || "N/A"} - ${stockData.fiftyTwoWeekHigh?.toFixed(2) || "N/A"}
                  </p>
                </div>
              </div>
            )}
            
            {/* Related notes for this stock */}
            {transactions?.some(t => t.stockSymbol === selectedHx.stock?.name && (t.publicNote || t.privateNote)) && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-4">Notes for {selectedHx.stock?.name}</h3>
                <div className="space-y-4">
                  {transactions
                    .filter(t => t.stockSymbol === selectedHx.stock?.name && (t.publicNote || t.privateNote))
                    .map(t => (
                      <div key={t.id} className="bg-gray-800 p-4 rounded-lg cursor-pointer" onClick={() => handleSelectNote(t.id)}>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-white font-medium">{new Date(t.timestamp).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-400">{t.type} @ ${t.price?.toFixed(2)}</p>
                        </div>
                        {t.publicNote && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-400">Public Note</p>
                            <p className="text-sm text-gray-200">{t.publicNote.length > 100 ? t.publicNote.substring(0, 100) + '...' : t.publicNote}</p>
                          </div>
                        )}
                        {t.privateNote && (
                          <div>
                            <p className="text-xs text-gray-400">Private Note</p>
                            <p className="text-sm text-gray-200">{t.privateNote.length > 100 ? t.privateNote.substring(0, 100) + '...' : t.privateNote}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Default view - no selection
          <div className="flex flex-col h-full items-center justify-center text-gray-400 text-center">
            <FileTextIcon className="mb-4" size={48} />
            <p className="text-xl">Welcome to Stock Notes</p>
            <p className="mt-2 max-w-md">
              Select a note or a holding from the sidebar to view details.
            </p>
          </div>
        )}
      </main>
      
      {/* Right sidebar - Holdings list (only visible on XL screens) */}
      <aside className="hidden lg:block xl:w-1/4 border-l border-white/10 bg-gray-800/50 backdrop-blur-sm overflow-y-auto">
        <div className="p-4 border-b border-white/10 sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10 shadow-sm">
          <h1 className="text-xl font-bold text-white">Holdings</h1>
          <p className="text-sm text-gray-400">{holdings?.filter(h => h.quantity > 0).length || 0} Items</p>
          
          {/* Holdings filter for desktop */}
          <div className="mt-2 relative">
            <input
              type="text"
              placeholder="Filter holdings..."
              value={holdingFilter}
              onChange={(e) => setHoldingFilter(e.target.value)}
              className="w-full bg-gray-700/50 text-white rounded px-3 py-2 pl-8 text-sm"
            />
            <FaSearch className="absolute left-2 top-3 text-gray-400 text-sm" />
            {holdingFilter && (
              <button
                onClick={() => setHoldingFilter("")}
                className="absolute right-2 top-2 text-gray-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        <div className="divide-y divide-white/10">
          {hLoading ? (
            <div className="p-4 text-gray-400">Loading holdings...</div>
          ) : hError ? (
            <div className="p-4 text-red-500">{hError}</div>
          ) : !holdings || holdings.filter(h => {
              // Filter by search term if any
              const matchesFilter = !holdingFilter || 
                h.stock?.name?.toLowerCase().includes(holdingFilter.toLowerCase());
              return h.quantity > 0 && matchesFilter;
            }).length === 0 ? (
            <div className="p-4 text-gray-400">
              {holdings?.some(h => h.quantity > 0)
                ? "No holdings match your filter."
                : "No holdings found."}
            </div>
          ) : (
            holdings
              .filter(h => {
                // Filter by search term if any
                const matchesFilter = !holdingFilter || 
                  h.stock?.name?.toLowerCase().includes(holdingFilter.toLowerCase());
                return h.quantity > 0 && matchesFilter; 
              })
              .map((tx) => (
                <div
                  key={tx.id}
                  className={`p-4 hover:bg-gray-700/30 transition cursor-pointer ${
                    selectedHoldingId === tx.id ? "bg-gray-700/50 border-l-4 border-blue-500" : ""
                  }`}
                  onClick={() => handleSelectHolding(tx.id)}
                >
                  <p className="text-white font-medium">{tx.stock?.name || "N/A"}</p>
                  <p className="text-sm text-gray-400">Shares: {tx.quantity.toFixed(2)}</p>
                  <p className="text-sm text-gray-400">
                    Price: ${tx.stock?.price?.toFixed(2) || "N/A"}
                  </p>
                  <p className="text-sm text-green-400">
                    Value: ${((tx.stock?.price || 0) * tx.quantity).toFixed(2)}
                  </p>
                </div>
              ))
          )}
        </div>
      </aside>
    </div>
  );
};

export default StockNotes;
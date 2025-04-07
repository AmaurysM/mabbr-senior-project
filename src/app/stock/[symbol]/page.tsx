"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { 
  FaArrowLeft, 
  FaArrowUp, 
  FaChartLine, 
  FaExchangeAlt, 
  FaDollarSign, 
  FaDollarSign as FaDollar, 
  FaArrowDown,
  FaTimes 
} from "react-icons/fa";
import { TransformedStockData } from "@/app/api/stocks/live/route";
import StockDetails from "@/app/components/StockDetails";
import StockChat from "@/app/components/StockChat";
import StockAbout from "@/app/components/StockAbout";
import StockKeyInsights from "@/app/components/StockKeyInsights";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SeriesData {
  name: string;
  type: string;
  data: any[];
}

const validIntervals = [
  "1d",
  "1m",
  "2m",
  "5m",
  "15m",
  "30m",
  "60m",
  "90m",
  "1h",
  "5d",
  "1wk",
  "1mo",
  "3mo",
];

const StockPage = () => {
  const { symbol } = useParams();
  const router = useRouter();
  const [series, setSeries] = useState<SeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("2025-01-01");
  const [interval, setInterval] = useState("1d");
  const [stockData, setStockData] = useState<TransformedStockData | null>(null);
  
  // Trade section state
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [isDollarAmount, setIsDollarAmount] = useState(true);
  const [amount, setAmount] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [privateNote, setPrivateNote] = useState('');

  // Modal state for full-screen summary
  const [isFullScreenSummary, setIsFullScreenSummary] = useState(false);

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/stocks/live?symbol=${symbol}&period=${period}&interval=${interval}`
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

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
        setError(err instanceof Error ? err.message : "Unknown error");
        setSeries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol, period, interval]);

  const candlestickSeries = series.find((s) => s.type === "candlestick");
  let dayRange = "N/A";
  if (candlestickSeries && candlestickSeries.data.length) {
    const lastData = candlestickSeries.data[candlestickSeries.data.length - 1];
    dayRange = `$${Number(lastData.y[2]).toFixed(2)} - $${Number(
      lastData.y[1]
    ).toFixed(2)}`;
  }

  const chartOptions: any = {
    chart: {
      type: "line",
      height: 500,
      background: "#1E293B",
      toolbar: {
        show: true,
        tools: {
          download: false,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 500,
        },
      },
    },
    stroke: {
      curve: "smooth",
      width: [3, 1],
    },
    title: {
      text: `${symbol} Stock Price`,
      align: "left",
      style: {
        color: "#FFFFFF",
        fontSize: "20px",
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        style: {
          colors: "#CBD5E1",
        },
      },
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
      labels: {
        style: {
          colors: "#CBD5E1",
        },
        formatter: (value: number) => `$${value.toFixed(2)}`,
      },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: "#10B981",
          downward: "#EF4444",
        },
      },
    },
    grid: {
      borderColor: "#334155",
    },
    tooltip: {
      theme: "dark",
      followCursor: true,
      x: {
        format: "MMM dd, HH:mm",
      },
    },
  };

  const formatNumber = (num: number | undefined) =>
    num ? num.toLocaleString() : "N/A";

  const handleTrade = () => {
    if (!amount) return;
    console.log(`${tradeType === 'buy' ? 'Buying' : 'Selling'} ${symbol}`, {
      amount,
      isDollarAmount,
      publicNote,
      privateNote
    });
    // Reset form after trade
    setAmount('');
    setPublicNote('');
    setPrivateNote('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="space-y-4">
            <div className="h-8 bg-slate-700 rounded w-1/3"></div>
            <div className="h-4 bg-slate-700 rounded w-1/4"></div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
            <div className="h-64 bg-slate-700 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-slate-800 p-6 rounded-xl flex items-center">
                <div className="bg-slate-700 p-4 rounded-lg mr-4 w-12 h-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                  <div className="h-6 bg-slate-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          Go back
        </button>
      </div>
    );
  }

  if (!stockData) {
    return null;
  }

  return (
    <div className="px-6 py-4 bg-slate-900 min-h-screen overflow-hidden">
      {/* Header Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center text-white">
              <FaChartLine className="mr-3 text-teal-500" />
              {symbol}
              <span className="ml-4 text-teal-500 text-xl font-normal">
                {(stockData.regularMarketChangePercent ?? 0) > 0 ? (
                  <div className="flex items-center mr-1 text-teal-500">
                    <FaArrowUp className="mr-1" />
                    {stockData.regularMarketChangePercent?.toFixed(2) || "N/A"}%
                  </div>
                ) : (
                  <div className="flex items-center mr-1 text-red-500">
                    <FaArrowDown className="mr-1" />
                    {stockData.regularMarketChangePercent?.toFixed(2) || "N/A"}%
                  </div>
                )}
              </span>
            </h1>
            <p className="text-slate-400 mt-2">
              {stockData.shortName} • {stockData.industry}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-teal-500/20 text-teal-500 rounded-lg hover:bg-teal-500/30 transition flex items-center"
          >
            <FaArrowLeft className="mr-2" />
            Go Back
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-4 mb-4">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          <StockDetails detailedData={stockData} />
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">{tradeType === 'buy' ? 'Buy' : 'Sell'} {symbol}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setTradeType('buy')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      tradeType === 'buy'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700/30 text-gray-400'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTradeType('sell')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      tradeType === 'sell'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700/30 text-gray-400'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsDollarAmount(true)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      isDollarAmount
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    $
                  </button>
                  <button
                    onClick={() => setIsDollarAmount(false)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      !isDollarAmount
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    Shares
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={isDollarAmount ? "Enter dollar amount..." : "Enter number of shares..."}
                className="w-full px-4 py-3 bg-gray-800/30 rounded-lg border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white placeholder-gray-500"
              />
              <input
                type="text"
                value={publicNote}
                onChange={(e) => setPublicNote(e.target.value)}
                placeholder="Public note (visible to everyone)..."
                className="w-full px-4 py-3 bg-gray-800/30 rounded-lg border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white placeholder-gray-500"
              />
              <input
                type="text"
                value={privateNote}
                onChange={(e) => setPrivateNote(e.target.value)}
                placeholder="Private note (only you can see this)..."
                className="w-full px-4 py-3 bg-gray-800/30 rounded-lg border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white placeholder-gray-500"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleTrade}
                  className={`flex-1 py-3 ${tradeType === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'} text-white rounded-lg font-medium transition-colors`}
                >
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} {symbol}
                </button>
                <button 
                  onClick={() => {
                    setAmount('');
                    setPublicNote('');
                    setPrivateNote('');
                  }}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column */}
        <div className="flex flex-col gap-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10 overflow-hidden">
            <h2 className="text-xl font-bold text-white mb-4">{symbol} Stock Price</h2>
            {series.length > 0 ? (
              <Chart options={chartOptions} series={series} type="line" height={460} />
            ) : (
              <div className="text-center py-12 text-slate-400">
                {error || "No chart data available"}
              </div>
            )}
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
            <h2 className="text-xl font-bold text-white mb-3">Key Insights</h2>
            <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="bg-gray-700/30 rounded-lg p-3">
                <h3 className="text-gray-400 text-sm mb-1">Current Price</h3>
                <p className="text-xl font-bold text-white">$181.46</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-3">
                <h3 className="text-gray-400 text-sm mb-1">Day Range</h3>
                <p className="text-md text-white">$174.62 - $194.14</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-3">
                <h3 className="text-gray-400 text-sm mb-1">Volume</h3>
                <p className="text-md text-white">157,350,538</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-3">
                <h3 className="text-gray-400 text-sm mb-1">Market Cap</h3>
                <p className="text-md text-white">$2,725,910,413,312</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-3">
                <h3 className="text-gray-400 text-sm mb-1">52 Week High</h3>
                <p className="text-md text-white">$N/A</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-3">
                <h3 className="text-gray-400 text-sm mb-1">52 Week Low</h3>
                <p className="text-md text-white">$N/A</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Match the height with the middle column */}
        <div className="flex flex-col gap-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 flex flex-col" style={{ height: '553px' }}>
            <div className="p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">{symbol} Chat</h2>
            </div>
            <div className="flex-grow overflow-hidden">
              <div className="h-full flex flex-col">
                <StockChat symbol={symbol as string} />
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10 flex flex-col" style={{ height: '316px' }}>
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold text-white mb-3">About {symbol}</h2>
              <div className="line-clamp-5 text-white text-sm flex-1 mb-2">
                Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, a line of smartphones; Mac, a line of personal computers; iPad, a line of multi-purpose tablets; and wearables, home, and accessories comprising AirPods, Apple TV, Apple Watch, Beats products, and HomePod. The company also offers AppleCare support services; cloud services; and operates various platforms, including the App Store that allows customers to discover and download applications and digital content, such as books, music, video, games, and podcasts. In addition, it provides various services, such as Apple Arcade, a game subscription service; Apple Music, which offers users a curated listening experience with on-demand radio stations; Apple News+, a subscription news and magazine service; Apple TV+, which offers exclusive original content; Apple Card, a co-branded credit card; and Apple Pay, a cashless payment service, as well as licenses its intellectual property.
              </div>
              <button 
                onClick={() => setIsFullScreenSummary(true)} 
                className="text-blue-400 text-sm hover:text-blue-300 self-start"
              >
                Read More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Summary Modal */}
      {isFullScreenSummary && (
        <div className="fixed inset-0 bg-slate-900/95 z-50 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">About {symbol}</h2>
              <button 
                onClick={() => setIsFullScreenSummary(false)}
                className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-700 text-white transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <h3 className="text-gray-400 text-sm">Company Name</h3>
                  <p className="text-white text-lg font-medium">{stockData.shortName || symbol}</p>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm">Symbol</h3>
                  <p className="text-white text-lg font-medium">{symbol}</p>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm">Sector</h3>
                  <p className="text-white text-lg font-medium">{stockData.sector || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm">Industry</h3>
                  <p className="text-white text-lg font-medium">{stockData.industry || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm">Exchange</h3>
                  <p className="text-white text-lg font-medium">{(stockData as any).fullExchangeName || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm mb-2">Market Cap</h3>
                  <p className="text-white text-lg font-medium">${formatNumber(stockData.marketCap)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-gray-400 text-sm mb-2">Business Summary</h3>
                <p className="text-white leading-relaxed">
                  {stockData.longBusinessSummary || 'No business summary available.'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-gray-400 text-sm mb-2">Current Price</h3>
                  <p className="text-xl font-bold text-white">${stockData.regularMarketPrice?.toFixed(2) || "N/A"}</p>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-gray-400 text-sm mb-2">52 Week High</h3>
                  <p className="text-xl font-bold text-white">${stockData.fiftyTwoWeekHigh?.toFixed(2) || "N/A"}</p>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-gray-400 text-sm mb-2">52 Week Low</h3>
                  <p className="text-xl font-bold text-white">${stockData.fiftyTwoWeekLow?.toFixed(2) || "N/A"}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setIsFullScreenSummary(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPage;

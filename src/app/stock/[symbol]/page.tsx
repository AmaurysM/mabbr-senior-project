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
  FaArrowDown
} from "react-icons/fa";
import { TransformedStockData } from "@/app/api/stocks/live/route";

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
  // Default values; feel free to change as needed.
  const [period, setPeriod] = useState("2025-01-01");
  const [interval, setInterval] = useState("1d");
  const [stockData, setStockData] = useState<TransformedStockData>(null);

  // Fetch chart and stock data whenever symbol, period or interval change.
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

  // Compute day range from the candlestick series, using the latest data point.
  const candlestickSeries = series.find((s) => s.type === "candlestick");
  let dayRange = "N/A";
  if (candlestickSeries && candlestickSeries.data.length) {
    const lastData = candlestickSeries.data[candlestickSeries.data.length - 1];
    // d.y is [open, high, low, close]
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

  // Format numbers for display
  const formatNumber = (num: number | undefined) =>
    num ? num.toLocaleString() : "N/A";

  // Handle settings form submission (prevent default since state updates trigger re-fetch)
  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <FaChartLine className="mr-3 text-teal-500" />
              {symbol}
              <span className="ml-4 text-teal-500 text-xl font-normal">
                { (stockData?.regularMarketChangePercent ?? 0) > 0 ? (
                  <div className=" flex items-center mr-1 text-teal-500">
                    <FaArrowUp  />
                    {stockData.regularMarketChangePercent?.toFixed(2) || "N/A"}% Regular Market Change Percent
                  </div>
                ) : (
                  <div className=" flex items-center mr-1 text-red-500">
                    <FaArrowDown />
                    {stockData.regularMarketChangePercent?.toFixed(2) || "N/A"}% Regular Market Change Percent
                  </div>
                )}
              </span>
            </h1>
            <p className="text-slate-400 mt-2">
            {stockData?.shortName} • {stockData?.industry}  
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

        {/* Settings Form
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl mb-8">
          <form onSubmit={handleSettingsSubmit} className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex flex-col">
              <label className="text-slate-400 text-sm mb-1">Period</label>
              <input
                type="date"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="p-2 rounded bg-slate-700 text-slate-100"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-slate-400 text-sm mb-1">Interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="p-2 rounded bg-slate-700 text-slate-100"
              >
                {validIntervals.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
            >
              Update
            </button>
          </form>
        </div> */}

        {/* Chart Section */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-xl mb-8">
          {series.length > 0 ? (
            <Chart options={chartOptions} series={series} type="line" height={500} />
          ) : (
            <div className="text-center py-12 text-slate-400">
              {error || "No chart data available"}
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-xl flex items-center">
            <div className="bg-teal-500/20 p-4 rounded-lg mr-4">
              <FaDollar className="text-3xl text-teal-500" />
            </div>
            <div>
              <h3 className="text-slate-400 text-sm">Current Price</h3>
              <p className="text-2xl font-bold">
                ${stockData?.regularMarketPrice?.toFixed(2) || "N/A"}
              </p>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl flex items-center">
            <div className="bg-purple-500/20 p-4 rounded-lg mr-4">
              <FaExchangeAlt className="text-3xl text-purple-500" />
            </div>
            <div>
              <h3 className="text-slate-400 text-sm">Day Range</h3>
              <p className="text-2xl font-bold">{dayRange}</p>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl flex items-center">
            <div className="bg-amber-500/20 p-4 rounded-lg mr-4">
              <FaDollarSign className="text-3xl text-amber-500" />
            </div>
            <div>
              <h3 className="text-slate-400 text-sm">Volume</h3>
              <p className="text-2xl font-bold">
                {formatNumber(stockData?.regularMarketVolume)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockPage;

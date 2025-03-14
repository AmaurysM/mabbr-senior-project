import { authClient } from '@/lib/auth-client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { UserCircleIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Comment } from '@prisma/client'

// Add a new interface for stock data
interface StockSymbolData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

// Add a cache for stock data to prevent flashing
const stockDataCache: Record<string, StockSymbolData> = {};

// Update the StockTooltip component to include company name
const StockTooltip = ({ symbol, data }: { symbol: string, data: StockSymbolData | null }) => {
  // Map of stock symbols to company names
  const companyNames: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOG': 'Alphabet Inc.',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com, Inc.',
    'META': 'Meta Platforms, Inc.',
    'TSLA': 'Tesla, Inc.',
    'NVDA': 'NVIDIA Corporation',
    'AMD': 'Advanced Micro Devices, Inc.',
    'INTC': 'Intel Corporation',
    'IBM': 'International Business Machines',
    'NFLX': 'Netflix, Inc.',
    'DIS': 'The Walt Disney Company',
    'CSCO': 'Cisco Systems, Inc.',
    'ADBE': 'Adobe Inc.',
    'ORCL': 'Oracle Corporation',
    'CRM': 'Salesforce, Inc.',
    'PYPL': 'PayPal Holdings, Inc.',
    'QCOM': 'Qualcomm Incorporated',
    'AVGO': 'Broadcom Inc.',
    'TXN': 'Texas Instruments Incorporated',
    'ASML': 'ASML Holding N.V.',
    'SONY': 'Sony Group Corporation',
    'SHOP': 'Shopify Inc.',
    'SPOT': 'Spotify Technology S.A.',
    'UBER': 'Uber Technologies, Inc.',
    'LYFT': 'Lyft, Inc.',
    'SNAP': 'Snap Inc.',
    'PINS': 'Pinterest, Inc.',
    'ZM': 'Zoom Video Communications, Inc.'
  };

  // Get company name or use a default
  const companyName = companyNames[symbol] || 'Corporation';

  if (!data) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
        <div className="text-gray-400 text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-white font-bold">{symbol}</div>
          <p className="text-gray-400 text-xs truncate max-w-[120px]">{companyName}</p>
        </div>
        <div className={`text-sm font-semibold ${data.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          ${data.price.toFixed(2)}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className={`text-xs ${data.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {data.isPositive ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
};

const GlobalCommentCard = ({ message }: { message: Comment }) => {
  const { data: session } = authClient.useSession()
  const [poster, setPoster] = useState<{ name: string; image: string | null } | null>(null);
  const [stockData, setStockData] = useState<Record<string, StockSymbolData>>({});
  const router = useRouter();

  const fetchStockData = async (symbols: string[]): Promise<void> => {
    try {
      // Filter out symbols that are already in the cache
      const symbolsToFetch = symbols.filter(symbol => !stockDataCache[symbol]);

      if (symbolsToFetch.length === 0) {
        // Update state with cached data
        const cachedData: Record<string, StockSymbolData> = {};
        symbols.forEach(symbol => {
          if (stockDataCache[symbol]) {
            cachedData[symbol] = stockDataCache[symbol];
          }
        });
        setStockData(prevData => ({ ...prevData, ...cachedData }));
        return;
      }

      const res = await fetch(`/api/stocks?symbols=${symbolsToFetch.join(',')}`);
      if (!res.ok) throw new Error('Failed to fetch stock data');

      const data = await res.json();
      if (!data.stocks || data.stocks.length === 0) return;

      const newStockData: Record<string, StockSymbolData> = {};

      data.stocks.forEach((stock: { symbol: string; price: number; change: number; changePercent: number }) => {
        const result = {
          symbol: stock.symbol,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changePercent,
          isPositive: stock.change >= 0
        };

        // Update cache
        stockDataCache[stock.symbol] = result;
        newStockData[stock.symbol] = result;
      });

      // Update state with new data
      setStockData(prevData => ({ ...prevData, ...newStockData }));
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };



  const formatTimestamp = (date: string | number | Date) => {
    if (!date) return 'Just now'; // Handle undefined/null cases

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return 'Invalid time'; // Handle invalid date

    // Handle cases where the time is extremely recent
    const now = new Date();
    if (parsedDate.getTime() > now.getTime()) return 'Just now';

    return formatDistanceToNow(parsedDate, { addSuffix: true });
  };


  const handleProfileClick = () => {
    sessionStorage.setItem("selectedUserId", message.userId);
    router.push(`/friendsProfile`)
  }

  // Extract stock symbols from content
  useEffect(() => {
    if (message.content) {
      const stockRegex = /#([A-Za-z]{1,5})\b/g;
      const matches = [...message.content.matchAll(stockRegex)];
      const symbols = matches.map(match => match[1].toUpperCase());

      if (symbols.length > 0) {
        fetchStockData(symbols);
      }
    }
  }, [message.content]);

  const formatMessageContent = (content: string) => {
    // Case-insensitive regex to match stock symbols with # prefix
    const stockRegex = /#([A-Za-z]{1,5})\b/g;

    // Split the content by stock symbols
    const parts = content.split(stockRegex);

    if (parts.length <= 1) {
      return <div className="text-gray-200">{content}</div>;
    }

    // Render the message with formatted stock symbols
    const formattedContent: React.ReactNode[] = [];
    let i = 0;

    while (i < parts.length) {
      // Add text part
      if (parts[i]) {
        formattedContent.push(<span key={`text-${i}`}>{parts[i]}</span>);
      }

      // Add stock symbol if available
      if (i + 1 < parts.length) {
        const symbol = parts[i + 1]?.toUpperCase(); // Convert to uppercase for consistency
        if (symbol) {
          const data = stockData[symbol] || stockDataCache[symbol];
          const isPositive = data?.isPositive ?? true;

          formattedContent.push(
            <div key={`stock-${i}`} className="inline-block relative group">
              <span
                className={`inline-flex items-center px-2 py-0.5 mx-1 rounded text-xs font-medium ${isPositive
                    ? 'bg-green-900/20 text-green-300 border border-green-700/30'
                    : 'bg-red-900/20 text-red-300 border border-red-700/30'
                  } cursor-pointer`}
              >
                {symbol}
                <span className="ml-1 font-mono">
                  {isPositive ? '↑' : '↓'}
                </span>
              </span>

              {/* Tooltip with fixed position above the symbol */}
              <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]"
                style={{
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '5px'
                }}>
                <StockTooltip symbol={symbol} data={data || null} />
              </div>
            </div>
          );
        }
        i += 2; // Skip the symbol part
      } else {
        i++;
      }
    }

    return <div className="text-gray-200">{formattedContent}</div>;
  };

  useEffect(() => {
    fetch("/api/user/getUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: message.userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error(data.error);
        } else {
          setPoster(data);
        }
      })
      .catch(() => {
        console.error("Error fetching user");
      });
  }, [message.userId])

  return (
    <div
      key={message.id}
      className={`flex items-start gap-3 ${message.userId === session?.user?.id
        ? 'bg-blue-600/20 rounded-xl p-3'
        : 'bg-gray-700/30 rounded-xl p-3'
        }`}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center cursor-pointer"
        onClick={handleProfileClick}
      >
        {poster?.image ? (
          <Image
            src={poster.image}
            alt={poster.name || 'User avatar'}
            width={40}
            height={40}
            className="object-cover"
          />
        ) : (
          <UserCircleIcon className="w-10 h-10 text-gray-400" />
        )}
      </div>

      <div className="flex-grow">
        <div className="flex justify-between items-center mb-1">
          <span
            className="font-semibold text-white cursor-pointer hover:underline"
            onClick={handleProfileClick}
          >
            {poster?.name || 'Unknown User'}
          </span>
          <span className="text-xs text-gray-400">{formatTimestamp(message.createdAt)}</span>
        </div>
        {message.content && (
          <div className="text-white">{formatMessageContent(message.content)}</div>
        )}
        {message.image && (
          <Image
            src={message.image}
            alt="Attached image"
            width={400}
            height={400}
            className="mt-2 rounded-lg"
          />
        )}
      </div>
    </div>
  )
}

export default GlobalCommentCard
import { authClient } from '@/lib/auth-client'
import React, { useCallback, useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Heart, MessageCircle, Share2, Flag, Trash, ChevronDown, UserCircle, Smile } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Comment } from '@prisma/client'
import UserVerificationIcon from './UserVerificationIcon/UserVerificationIcon'
import { User } from '@/lib/prisma_types'
import Link from 'next/link'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

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
const StockTooltip = ({ symbol, data, isLoading }: { symbol: string, data: StockSymbolData | null, isLoading: boolean }) => {
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

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 min-w-[180px]">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-white font-bold">{symbol}</div>
            <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mt-1"></div>
          </div>
          <div className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="flex justify-between items-center mt-3">
          <div className="h-4 w-20 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3">
        <div className="text-gray-400 text-center">No data available</div>
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

      <div className="flex justify-between items-center mt-1">
        <div className={`text-xs ${data.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {data.isPositive ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
};

interface Reaction {
  emoji: string
  count: number
  me: boolean
}

// Custom hook for detecting clicks outside of a component
const useClickAway = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// Common emojis for quick reactions
const commonEmojis = [
  { emoji: "👍", label: "Thumbs Up" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "😂", label: "Joy" },
  { emoji: "🎉", label: "Party" },
  { emoji: "👏", label: "Clap" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "💯", label: "100" },
  { emoji: "🤔", label: "Thinking" }
];

// Skeleton loader for different parts of the comment card
const SkeletonLoader = ({ type }: { type: 'avatar' | 'name' | 'text' | 'image' | 'reactions' | 'actions' }) => {
  switch (type) {
    case 'avatar':
      return <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>;
    case 'name':
      return <div className="h-5 w-32 bg-gray-700 rounded animate-pulse"></div>;
    case 'text':
      return (
        <div className="space-y-2 w-full">
          <div className="h-4 bg-gray-700 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div>
        </div>
      );
    case 'image':
      return <div className="mt-2 w-full h-48 bg-gray-700 rounded-lg animate-pulse"></div>;

    default:
      return null;
  }
};

const GlobalCommentCard = ({ message, onDelete }: { message: Comment, onDelete?: (id: string) => void }) => {
  const { data: session } = authClient.useSession()
  const [poster, setPoster] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [stockData, setStockData] = useState<Record<string, StockSymbolData>>({})
  const [loadingStocks, setLoadingStocks] = useState<string[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [isLoadingReactions, setIsLoadingReactions] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const router = useRouter()

  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  useClickAway(emojiPickerRef, () => setShowEmojiPicker(false))
  useClickAway(actionMenuRef, () => setShowActionMenu(false))

  const fetchReactions = useCallback(async () => {
    setIsLoadingReactions(true);
    try {
      const res = await fetch(`/api/comment/reaction?messageId=${message.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch reactions');

      const data = await res.json();
      setReactions(data.reactions);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setIsLoadingReactions(false);
    }
  }, [message.id]);

  const handleAddReaction = async (emoji: string) => {
    if (session?.user.id === message.userId) {
      // Prevent reacting to own comment
      return
    }

    try {
      const res = await fetch('/api/comment/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          emoji,
        }),
      });

      if (!res.ok) throw new Error('Failed to toggle reaction');

      // Update local state with the new reactions data
      const data = await res.json();
      setReactions(data.reactions);

      // Hide emoji picker after selection
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  }

  const handleToggleReaction = async (emoji: string) => {
    if (session?.user.id === message.userId) {
      // Prevent reacting to own comment
      return
    }

    try {
      const res = await fetch('/api/comment/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          emoji,
        }),
      });

      if (!res.ok) throw new Error('Failed to toggle reaction');

      // Update local state with the new reactions data
      const data = await res.json();
      setReactions(data.reactions);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  }

  const fetchStockData = async (symbols: string[]): Promise<void> => {
    try {
      // Update loading state for symbols
      setLoadingStocks(symbols);
      
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
        setLoadingStocks([]);
        return;
      }

      const res = await fetch(`/api/stocks?symbols=${symbolsToFetch.join(',')}`);
      if (!res.ok) throw new Error('Failed to fetch stock data');

      const data = await res.json();
      
      const newStockData: Record<string, StockSymbolData> = {};

      if (data.stocks && data.stocks.length > 0) {
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
      }

      // Update state with new data
      setStockData(prevData => ({ ...prevData, ...newStockData }));
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      // Clear loading state
      setLoadingStocks([]);
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

  // Share the message
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this comment',
        text: `${poster?.name || 'Someone'} said: ${message.content}`,
        url: window.location.href
      })
        .then(() => console.log('Successfully shared'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch((err) => console.error('Could not copy text: ', err));
    }
    setShowActionMenu(false);
  }

  // Report the message
  const handleReport = () => {
    // Implement reporting functionality
    alert('Comment reported. Our team will review it shortly.');
    setShowActionMenu(false);
  }

  // Delete the message (only if user is the author)
  const handleDelete = async () => {
    if (session?.user.id !== message.userId) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/comment?id=${message.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete comment');
      
      // Set the comment as deleted in the local state
      setIsDeleted(true);
      
      // Call the onDelete callback to notify parent component
      if (onDelete) {
        onDelete(message.id);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setIsDeleting(false);
    }
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
          const isLoading = loadingStocks.includes(symbol);
          const isPositive = data?.isPositive ?? true;

          formattedContent.push(
            <Link href={`/stock/${symbol}`} key={`stock-${i}`} className="inline-block relative group">
              <span
                className={`inline-flex items-center px-2 py-0.5 mx-1 rounded text-xs font-medium ${isLoading 
                  ? 'bg-gray-700/50 text-gray-300 border border-gray-600/30' 
                  : isPositive
                    ? 'bg-green-900/20 text-green-300 border border-green-700/30'
                    : 'bg-red-900/20 text-red-300 border border-red-700/30'
                  } cursor-pointer hover:opacity-80 transition-opacity`}
              >
                {symbol}
                {isLoading ? (
                  <span className="ml-1 w-3 h-3 rounded-full bg-gray-600 animate-pulse"></span>
                ) : (
                  <span className="ml-1 font-mono">
                    {isPositive ? '↑' : '↓'}
                  </span>
                )}
              </span>

              {/* Tooltip with fixed position above the symbol */}
              <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]"
                style={{
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: '5px'
                }}>
                <StockTooltip symbol={symbol} data={data || null} isLoading={isLoading} />
              </div>
            </Link>
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
    fetchReactions();
  }, [fetchReactions]);

  useEffect(() => {
    setIsLoadingUser(true);
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
          console.warn("User fetch warning:", data.error); 
          return;
        } else {
          setPoster(data);
        }
      })
      .catch(() => {
        console.error("Error fetching user");
      })
      .finally(() => {
        setIsLoadingUser(false);
      });
  }, [message.userId]);
  
  // If comment has been deleted, don't render anything
  if (isDeleted) {
    return null;
  }

  return (
    <div
      key={message.id}
      className={`flex items-start gap-3 p-4 ${message.userId === session?.user?.id
        ? 'bg-blue-600/20 rounded-xl border border-blue-500/30'
        : 'bg-gray-800/50 rounded-xl border border-gray-700/50 hover:bg-gray-800/80 transition-colors'
        }`}
    >
      {/* User avatar - show skeleton loader when loading */}
      {isLoadingUser ? (
        <SkeletonLoader type="avatar" />
      ) : (
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center cursor-pointer ring-2 ring-gray-700 hover:ring-blue-500 transition-all"
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
            <UserCircle className="w-10 h-10 text-gray-400" />
          )}
        </div>
      )}

      <div className="flex-grow">
        <div className="flex justify-between items-center mb-1">
          {/* User name - show skeleton loader when loading */}
          {isLoadingUser ? (
            <SkeletonLoader type="name" />
          ) : (
            <div
              className="font-semibold text-white cursor-pointer hover:underline"
              onClick={handleProfileClick}
            >
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-200">{poster?.name || "Unknown User"}</span>
                <UserVerificationIcon userRole={poster?.role} className="h-3 w-3 text-blue-500" />
              </div>
            </div>
          )}
          <span className="text-xs text-gray-400">{formatTimestamp(message.createdAt)}</span>
        </div>

        {/* Message content - show skeleton loader when loading */}
        {message.content ? (
          <div className="text-white mb-2">{formatMessageContent(message.content)}</div>
        ) : (
          <SkeletonLoader type="text" />
        )}

        {/* Message image - show skeleton loader when loading */}
        {message.image && (
          <div className="mt-2 rounded-lg overflow-hidden">
            <Image
              src={message.image}
              alt="Attached image"
              width={400}
              height={400}
              className="w-full object-cover hover:opacity-95 transition-opacity"
            />
          </div>
        )}

        {/* Interaction bar */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700/50">
          {/* Reaction buttons */}
          <div className="flex items-center space-x-4">
            {/* Add reaction button */}
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors py-1"
                disabled={session?.user.id === message.userId}
              >
                <Smile size={16} className={session?.user.id === message.userId ? "text-gray-600" : ""} />
                <span>React</span>
              </button>

              {showEmojiPicker && (
                <div className="absolute z-20 top-full left-full">
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-2xl w-64">
                    <div className="grid grid-cols-5 gap-2">
                      {commonEmojis.map(({ emoji, label }) => (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(emoji)}
                          className="flex items-center justify-center w-10 h-10 text-xl rounded-lg hover:bg-gray-700 transition-colors"
                          title={label}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
{/* Display reactions */}
        {isLoadingReactions ? (
          <SkeletonLoader type="reactions" />
        ) : reactions && reactions.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-2">
            {reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleToggleReaction(reaction.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium border transition
                ${reaction.me
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                  }`}
                disabled={session?.user.id === message.userId}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        ) : null}
          {/* Delete button */}
          {session?.user.id === message.userId && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-left px-4 py-2 text-sm text-red-400 flex items-center gap-2 hover:text-red-300 transition-colors"
            >
              <Trash size={16} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalCommentCard;
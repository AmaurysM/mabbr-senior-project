import { authClient } from '@/lib/auth-client'
import React, { useCallback, useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Reply, Bookmark, MoreHorizontal, Trash, AlertTriangle, Share, Heart, UserCircle, PlusCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Comment } from '@prisma/client'
import UserVerificationIcon from './UserVerificationIcon/UserVerificationIcon'
import { User } from '@/lib/prisma_types'
import Link from 'next/link'
import StockTooltip from './StockTooltip'

// Stock data interface
interface StockSymbolData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

// Global cache for stock data
const stockDataCache: Record<string, StockSymbolData> = {};

interface Reaction {
  emoji: string;
  count: number;
  me: boolean;
}

interface CommentCardProps {
  message: Comment;
  isFirstInThread?: boolean;
  onDelete?: (id: string) => void;
  onReply?: (message: Comment) => void;
  onReactionToggle?: (messageId: string, emoji: string) => void;
  showReplies?: boolean;
  showTimeAgo?: boolean;
  groupedWithPrevious?: boolean;
}

// Common reactions
const COMMON_REACTIONS = [
  { emoji: "👍", label: "Thumbs Up" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "😂", label: "Laugh" },
  { emoji: "🎉", label: "Celebrate" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "👀", label: "Eyes" },
  { emoji: "🚀", label: "Rocket" },
  { emoji: "💯", label: "100" },
];

// Custom hook for detecting outside clicks
const useOutsideClick = (callback) => {
  const ref = useRef();

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [callback]);

  return ref;
};

const DiscordCommentCard = ({
  message,
  isFirstInThread = true,
  groupedWithPrevious = false,
  onDelete,
  onReply,
  showReplies = true,
  showTimeAgo = true
}: CommentCardProps) => {
  const { data: session } = authClient.useSession();
  const [poster, setPoster] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stockData, setStockData] = useState<Record<string, StockSymbolData>>({});
  const [loadingStocks, setLoadingStocks] = useState<string[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const router = useRouter();
  const isOwnMessage = session?.user?.id === message.userId;

  const reactionPickerRef = useOutsideClick(() => setShowReactionPicker(false));
  const optionsMenuRef = useOutsideClick(() => setShowOptions(false));

  // Fetch user details
  useEffect(() => {
    setIsLoading(true);
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
          setError("Failed to load user");
        } else {
          setPoster(data);
        }
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        setError("Failed to load user");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [message.userId]);

  // Fetch reactions
  const fetchReactions = useCallback(async () => {
    try {
      const res = await fetch(`/api/comment/reaction?messageId=${message.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch reactions');

      const data = await res.json();
      setReactions(data.reactions || []);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  }, [message.id]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  // Toggle reaction
  const handleToggleReaction = async (emoji) => {
    if (isOwnMessage) return; // Can't react to own message

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

      const data = await res.json();
      setReactions(data.reactions);
      setShowReactionPicker(false);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    if (!date) return 'Just now';

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return '';

    return formatDistanceToNow(parsedDate, { addSuffix: true });
  };

  // Format the actual time for tooltip
  const formatActualTime = (date) => {
    if (!date) return '';

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return '';

    return parsedDate.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle stock data fetch
  const fetchStockData = useCallback(async (symbols) => {
    try {
      setLoadingStocks(symbols);

      // Filter symbols that are already in cache
      const symbolsToFetch = symbols.filter(symbol => !stockDataCache[symbol]);

      if (symbolsToFetch.length === 0) {
        // Use cached data
        const cachedData = {};
        symbols.forEach(symbol => {
          if (stockDataCache[symbol]) {
            cachedData[symbol] = stockDataCache[symbol];
          }
        });
        setStockData(prev => ({ ...prev, ...cachedData }));
        setLoadingStocks([]);
        return;
      }

      const res = await fetch(`/api/stocks?symbols=${symbolsToFetch.join(',')}`);
      if (!res.ok) throw new Error('Failed to fetch stock data');

      const data = await res.json();
      const newStockData = {};

      if (data.stocks && data.stocks.length > 0) {
        data.stocks.forEach(stock => {
          const stockInfo = {
            symbol: stock.symbol,
            price: stock.price,
            change: stock.change,
            changePercent: stock.changePercent,
            isPositive: stock.change >= 0
          };

          stockDataCache[stock.symbol] = stockInfo;
          newStockData[stock.symbol] = stockInfo;
        });
      }

      setStockData(prev => ({ ...prev, ...newStockData }));
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoadingStocks([]);
    }
  }, []);

  // Extract stock symbols from content
  useEffect(() => {
    if (message.content) {
      const stockRegex = /#([A-Za-z]{1,5})\b/g;
      const matches = [...message.content.matchAll(stockRegex)];
      const symbols = [...new Set(matches.map(match => match[1].toUpperCase()))];

      if (symbols.length > 0) {
        fetchStockData(symbols);
      }
    }
  }, [message.content, fetchStockData]);

  // Handle profile navigation
  const handleProfileClick = () => {
    sessionStorage.setItem("selectedUserId", message.userId);
    router.push(`/friendsProfile`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!isOwnMessage) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/comment?id=${message.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete comment');

      setIsDeleted(true);
      if (onDelete) {
        onDelete(message.id);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete');
    } finally {
      setIsDeleting(false);
      setShowOptions(false);
    }
  };

  // Handle reply
  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
    setShowOptions(false);
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Comment by ${poster?.name || 'User'}`,
        text: message.content,
        url: window.location.href
      })
        .catch(err => console.error('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(message.content)
        .then(() => alert('Comment copied to clipboard'))
        .catch(err => console.error('Error copying:', err));
    }
    setShowOptions(false);
  };

  // Handle report
  const handleReport = () => {
    alert('Comment reported. Our team will review it.');
    setShowOptions(false);
  };

  // Format message content with stock symbols
  const formatMessageContent = (content: string) => {
    if (!message.content) return null;

    const stockRegex = /#([A-Za-z]{1,5})\b/g;
    const parts = message.content.split(stockRegex);

    if (parts.length <= 1) {
      return <div className="whitespace-pre-wrap break-words text-gray-100">{message.content}</div>;
    }

    const formattedContent = [];
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

  // If deleted, don't render
  if (isDeleted) return null;

  return (
    <div
      className={`relative flex ${groupedWithPrevious ? 'mt-0.5 pt-0' : 'mt-3 pt-1'}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Left: User avatar or indent space */}
      {isFirstInThread || !groupedWithPrevious ? (
        <div className="flex-shrink-0 mt-0.5">
          {isLoading ? (
            <div className="w-10 h-10 rounded-full bg-gray-700/60 animate-pulse"></div>
          ) : (
            <button
              onClick={handleProfileClick}
              className="w-10 h-10 rounded-full overflow-hidden hover:shadow-md transition-shadow flex-shrink-0"
              aria-label={`${poster?.name || "User"}'s profile`}
            >
              {poster?.image ? (
                <Image
                  src={poster.image}
                  alt={poster?.name || "User avatar"}
                  width={40}
                  height={40}
                  className="object-cover w-10 h-10"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-700 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="w-10 flex-shrink-0"></div>
      )}

      {/* Right: Content area */}
      <div className="flex flex-col ml-2 flex-grow min-w-0 max-w-full">
        {/* Header: Username & timestamp */}
        {(isFirstInThread || !groupedWithPrevious) && (
          <div className="flex items-center mb-1 gap-2">
            {isLoading ? (
              <div className="h-5 w-24 bg-gray-700/60 rounded animate-pulse"></div>
            ) : (
              <>
                <button
                  onClick={handleProfileClick}
                  className="font-medium text-sm md:text-base hover:underline text-gray-100 flex items-center"
                >
                  {poster?.name || "User"}
                  {poster?.role && (
                    <UserVerificationIcon
                      userRole={poster.role}
                      className="h-3.5 w-3.5 ml-1 text-blue-400"
                    />
                  )}
                </button>

                <div className="text-xs text-gray-400 hover:text-gray-300 cursor-default" title={formatActualTime(message.createdAt)}>
                  {showTimeAgo ? formatTime(message.createdAt) : formatActualTime(message.createdAt)}
                </div>
              </>
            )}
          </div>
        )}

        {/* Message content */}
        <div className="text-sm md:text-base mb-1 break-words">
          {isLoading ? (
            <div className="space-y-1.5">
              <div className="h-4 bg-gray-700/60 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-700/60 rounded w-3/4 animate-pulse"></div>
            </div>
          ) : (
            formatMessageContent(message.content)
          )}
        </div>

        {/* Attached image (if any) */}
        {message.image && (
          <div className="mt-1 mb-2 rounded-md overflow-hidden max-w-xs md:max-w-sm">
            <Image
              src={message.image}
              alt="Attached image"
              width={400}
              height={300}
              className="object-cover w-full max-h-60 hover:brightness-105 transition-all"
            />
          </div>
        )}

        {/* Reactions bar */}
        {reactions.length > 0 && (
          <div className="flex overflow-x-auto gap-1.5 mt-1 mb-1 custom-scrollbar-reactions">
            {reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleToggleReaction(reaction.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${reaction.me
                  ? 'bg-indigo-600/50 border-indigo-500/60 text-gray-100'
                  : 'bg-gray-800/80 border-gray-700/60 text-gray-300 hover:bg-gray-700/80'
                  }`}
                disabled={isOwnMessage}
              >
                <span>{reaction.emoji}</span>
                <span className="text-xs font-medium">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Action buttons (visible on hover) */}
        <div
          className={`absolute right-0 top-0 flex items-center gap-1 transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Add reaction button */}
          {!isOwnMessage && (
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-1.5 rounded-full hover:bg-gray-700/60 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Add reaction"
            >
              <PlusCircle size={16} />
            </button>
          )}

          {/* Options menu button - Only show for own messages */}
          {isOwnMessage && (
            <div className="relative" ref={optionsMenuRef}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-1.5 rounded-full hover:bg-gray-700/60 text-gray-400 hover:text-gray-200 transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal size={16} />
              </button>

              {/* Options dropdown menu */}
              {showOptions && (
                <div className="absolute right-0 top-full mt-1 py-1 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-30 w-36">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-gray-700/60 flex items-center gap-2"
                  >
                    <Trash size={14} />
                    <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700/60 flex items-center gap-2"
                  >
                    <Share size={14} />
                    <span>Share</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reaction picker */}
        {showReactionPicker && (
          <div
            ref={reactionPickerRef}
            className="absolute top-full left-0 mt-1 p-1.5 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-30"
          >
            <div className="flex gap-1 flex-wrap">
              {COMMON_REACTIONS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={() => handleToggleReaction(emoji)}
                  className="p-1.5 text-lg hover:bg-gray-700 rounded transition-colors"
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscordCommentCard;
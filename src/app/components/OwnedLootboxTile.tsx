import React from "react";
import { LootboxWithStocks, UserLootBox } from "@/lib/prisma_types";
import clsx from "clsx";
import { Shield, Gem, Star, Leaf, Package } from "lucide-react";

const getRarityStyles = (price: number) => {
  if (price > 500)
    return {
      name: "Legendary",
      border: "border-yellow-400",
      bg: "bg-gray-800",
      accentBg: "bg-yellow-900",
      text: "text-yellow-400",
      button: "bg-yellow-500 hover:bg-yellow-600",
      icon: <Star className="w-8 h-8 text-yellow-400" />,
    };
  if (price > 100)
    return {
      name: "Epic",
      border: "border-purple-500",
      bg: "bg-gray-800",
      accentBg: "bg-purple-900",
      text: "text-purple-400",
      button: "bg-purple-500 hover:bg-purple-600",
      icon: <Gem className="w-8 h-8 text-purple-400" />,
    };
  if (price > 50)
    return {
      name: "Rare",
      border: "border-blue-500",
      bg: "bg-gray-800",
      accentBg: "bg-blue-900",
      text: "text-blue-400",
      button: "bg-blue-500 hover:bg-blue-600",
      icon: <Shield className="w-8 h-8 text-blue-400" />,
    };
  if (price > 10)
    return {
      name: "Uncommon",
      border: "border-green-500",
      bg: "bg-gray-800",
      accentBg: "bg-green-900",
      text: "text-green-400",
      button: "bg-green-500 hover:bg-green-600",
      icon: <Leaf className="w-8 h-8 text-green-400" />,
    };
  return {
    name: "Common",
    border: "border-gray-500",
    bg: "bg-gray-800",
    accentBg: "bg-gray-700",
    text: "text-gray-400",
    button: "bg-gray-500 hover:bg-gray-600",
    icon: <Package className="w-8 h-8 text-gray-400" />,
  };
};

const OwnedLootboxTile = ({  userLootbox }: { userLootbox: UserLootBox }) => {
  console.log("OwnedLootboxTile", userLootbox);
    const rarity = getRarityStyles(userLootbox.lootBox.price);

  return (
    <div
      className={clsx(
        "relative rounded-md overflow-hidden shadow-md border-2",
        rarity.border,
        rarity.bg
      )}
    >
      {/* Owned Badge */}
      <div className={clsx(
        "absolute top-2 left-2 text-xs font-bold uppercase bg-black/50 text-white px-2 py-1 rounded bg-green-700"
      )}>
        {`Owned ${ userLootbox.quantity > 0 ? userLootbox.quantity : "" }`} 
      </div>

      {/* Top handle/lid */}
      <div className={clsx(
        "h-4 w-20 mx-auto rounded-b-md border-b-2 border-l-2 border-r-2",
        rarity.border
      )}></div>
      
      {/* Case header with icon and name */}
      <div className={clsx(
        "px-4 py-3", 
        rarity.accentBg,
        "flex items-center justify-between border-b-2",
        rarity.border
      )}>
        <div className="flex items-center space-x-2">
          {rarity.icon}
          <span className={clsx("font-bold uppercase text-sm truncate max-w-32", rarity.text)}>
            {userLootbox.lootBox.name || `${rarity.name} Case`}
          </span>
        </div>
        <div className="bg-black/50 rounded px-2 py-1">
          <span className={clsx("text-sm font-bold", rarity.text)}>
            ${userLootbox.lootBox.price}
          </span>
        </div>
      </div>
      
      {/* Main box content */}
      <div className="p-3">
        {/* Open button */}
        <button
          className={clsx(
            "w-full py-2 mt-3 rounded text-white font-bold text-sm uppercase",
            "bg-green-500 hover:bg-green-600"
          )}
        >
          Open Case
        </button>
      </div>
    </div>
  );
};

export default OwnedLootboxTile;

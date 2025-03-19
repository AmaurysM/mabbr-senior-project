"use client";

import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Slider from "react-slick";
import { motion } from "framer-motion";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { LootBoxWithStock, UserLootBox } from '@/lib/prisma_types';
import LoadingStateAnimation from '@/app/components/LoadingState';
import { useRouter } from 'next/navigation';
import { getRarityStyles } from '@/app/components/LootboxTile';

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter(); // Initialize router

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStock, setSelectedStock] = useState<LootBoxWithStock | null>(null);
  const [lootBox, setLootBox] = useState<UserLootBox | null>(null);
  const sliderRef = useRef<Slider>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(null);


  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedId(resolved.id);
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!resolvedId) return;
  
    const fetchLootbox = async () => {
      try {
        console.log(`Fetching lootbox with ID: ${resolvedId}`);
        
        const response = await fetch(`/api/users/userLootBoxes/loot?id=${resolvedId}`);
        console.log("Response status:", response.status);
    
        if (response.status === 404) {
          console.warn("Lootbox not found, stopping requests...");
          setLootBox(null); // Stop trying to fetch again
          return;
        }
    
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
    
        const data = await response.json();
        console.log("Fetched lootbox:", data);
        
        setLootBox(data);
      } catch (error) {
        console.error("Error fetching lootbox:", error);
      }
    };
    
  
    fetchLootbox();
  }, [resolvedId, router]); 
  
  

  useEffect(() => {
    const addCostToStock = async () => {
      if (!lootBox) return;

      const hasAllPrices = lootBox.lootBox.lootBoxStocks.every(
        (lootboxStock) => lootboxStock.stock.price !== 0
      ); 
      
      if (hasAllPrices) return;

      const updatedLootBoxStocks = await Promise.all(
        lootBox.lootBox.lootBoxStocks.map(async (lootboxStock) => {
          try {
            const res = await fetch(`/api/stock?symbol=${lootboxStock.stock.name}`);
            if (!res.ok) {
              throw new Error(`Error: ${res.status} ${res.statusText}`);
            }

            const stockData = await res.json();
            lootboxStock.stock.price = stockData.quoteResponse.result[0].regularMarketPrice;

            return lootboxStock;
          } catch (error) {
            console.error("Error fetching stock data:", error);
            lootboxStock.stock.price = 0;
            return lootboxStock;
          }
        })
      );

      setLootBox({
        ...lootBox,
        lootBox: {
          ...lootBox.lootBox,
          lootBoxStocks: updatedLootBoxStocks
        }
      });
    };

    addCostToStock();
  }, [lootBox]); 

  if (!lootBox) {
    return (
      <div className="w-full h-full bg-gray-800 p-6 mb-8 flex justify-center items-center">
        <LoadingStateAnimation />
      </div>
    );
  }

  const getRandomStock = () => {
    const randomIndex = Math.floor(Math.random() * lootBox.lootBox.lootBoxStocks.length);
    return lootBox.lootBox.lootBoxStocks[randomIndex];
  };

  const settings = {
    className: "center",
    centerMode: true,
    infinite: true,
    centerPadding: "60px",
    slidesToShow: 5,
    speed: 500,
    rows: 1,
    slidesToScroll: 1,
    swipeToSlide: false,
    swipe: false,
    touchMove: false,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          centerPadding: "40px",
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          centerPadding: "60px",
        }
      }
    ]
  };
  async function handleSpin(): Promise<void> {
    if (isSpinning || !sliderRef.current || !lootBox) return;
  
    setIsSpinning(true);
    setSelectedStock(null);
  
    const winningStock = getRandomStock();
    const winningIndex = lootBox.lootBox.lootBoxStocks.findIndex(stock => stock.stock.name === winningStock.stock.name);
  
    if (winningIndex === -1) {
      console.error("Winning stock not found in the list!");
      setIsSpinning(false);
      return;
    }
  
    const totalSpins = 5;
    const totalStocks = lootBox.lootBox.lootBoxStocks.length;
    const totalSlidesToMove = (totalSpins * totalStocks) + winningIndex;
  
    sliderRef.current.slickGoTo(0, true);
  
    setTimeout(() => {
      sliderRef.current?.slickGoTo(totalSlidesToMove, false);
  
      setTimeout(async () => {
        setSelectedStock(winningStock);
  
        try {
          const response = await fetch(`/api/users/userLootBoxes/loot`, {
            method: "PATCH", 
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lootBoxId: lootBox.id,
              winningStockId: winningStock.stockId,
            }),
          });
        
          if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
          }
        
          const result = await response.json();
          console.log("Stock added successfully:", result);
        
          // Don't check lootBox state here, directly redirect
          router.push("/lootbox");
        } catch (error) {
          console.error("Error updating user's account:", error);
          setIsSpinning(false);
        }
      }, 4000);
    }, 100);
  }
  

  return (
    <div
      className="text-white"
      style={{
        backgroundImage: "url('/sunny-landscape-tini.jpg')",
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        height: 'min-h-screen',
      }}
    >
      <div className="min-h-screen backdrop-filter backdrop-blur-lg">
        <div
          className=" m-3 bg-gray-800 rounded-lg shadow-lg p-3 inline-block"
          style={{
            background: "linear-gradient(to right, rgba(31, 41, 55, 0.8), rgba(31, 41, 55, 0))",
            width: "fit-content",
          }}
        >
          <Link
            href="/lootbox"
            className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Cases
          </Link>
        </div>

        <div className="container mx-auto">
          {/* Case Info */}
          <div className="text-center mb-8">
            <p className="text-gray-600">Contains {lootBox.lootBox.lootBoxStocks.length} possible stocks</p>
          </div>

          {/* Selected Item Display */}
          {selectedStock && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-8 text-center"
            >
              <div className={`inline-block bg-gradient-to-b ${getRarityStyles(selectedStock.stock.price)} 
            p-8 rounded-lg border-2 border-opacity-50 shadow-xl`}>
                <motion.div
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  className="text-3xl font-bold text-white mb-4 uppercase tracking-wider"
                >
                  Congratulations!
                </motion.div>
                <motion.div
                  className="text-4xl font-bold text-yellow-400 mb-3 tracking-widest"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                >
                  {selectedStock.stock.name}
                </motion.div>
                <div className="text-3xl font-bold text-green-400">
                  {selectedStock.stock.price !== 0 ? `$${selectedStock.stock.price}` : ""}
                </div>
              </div>
            </motion.div>
          )}

          {/* Spinner Section */}
          <section className="relative flex flex-col items-center">
            <div className="relative w-full border-t-2 border-b-2 border-e-slate-400  shadow-md">
              {/* Center Marker */}
              <div className="absolute left-1/2 top-0 h-full w-1 bg-yellow-500 z-20 transform -translate-x-1/2">
                <div className="absolute top-0 left-1/2 h-full w-24 transform -translate-x-1/2
              bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent blur-sm"></div>
              </div>
              {/* Glowing Edges */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-700 via-transparent to-slate-700"></div>

              {/* Stock Carousel */}
              <div className={isSpinning ? 'spinning' : ''}>
                <Slider ref={sliderRef} {...settings} className="py-2">
                  {[...Array(10)].map((_, repeatIndex) => (
                    lootBox?.lootBox.lootBoxStocks.map((lootboxStock, stockIndex) => (
                      <div key={`${repeatIndex}-${stockIndex}`} className="px-2">
                        <div className="w-full h-36 flex items-center justify-center rounded-lg border 
                      bg-gray-900/60 backdrop-blur-md shadow-lg shadow-yellow-400/30">
                          <div className="text-xl font-bold text-center text-white">
                            {lootboxStock.stock.name}
                          </div>
                        </div>
                      </div>
                    ))
                  ))}
                </Slider>
              </div>
            </div>

            {/* Spin Button */}
            <div className="mt-8">
              <button
                className="py-2 px-4 bg-yellow-500 rounded-md text-lg text-white hover:bg-yellow-400 transition-colors"
                onClick={handleSpin}
                disabled={isSpinning}
              >
                {isSpinning ? 'Spinning...' : 'Spin'}
              </button>
            </div>


          </section>

          {/* Possible Items Section*/}
          <section className="mt-16">
            <h2 className="text-xl font-bold mb-6 text-center">Possible Stocks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {lootBox.lootBox.lootBoxStocks.map((lootboxStock, stockIndex) => (
                <div key={stockIndex} className="bg-gray-800 p-6 rounded-lg border border-gray-600 shadow-xl hover:bg-gray-700">
                  <div className="text-xl text-center text-yellow-400">{lootboxStock.stock.name}</div>
                  <div className="text-lg text-center text-green-400">{lootboxStock.stock.price !== 0 ? `$${lootboxStock.stock.price}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Page;

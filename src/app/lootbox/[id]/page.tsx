"use client";

import React, { use, useEffect, useState, useRef } from 'react';
import { lootboxes } from '@/app/constants/LootBoxDataTest';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { StockData } from '@/app/constants/StockDataTest';
import Slider from "react-slick";
import { motion } from "framer-motion";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Page = ({ params }: { params: Promise<{ id: string }> }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
    const sliderRef = useRef<Slider>(null);
    const resolvedParams = React.use(params);
    const product = lootboxes.find(p => p.id === resolvedParams.id);

    if (!product) {
        return <Link href="/"></Link>;
    }

    const getRandomStock = () => {
        const randomIndex = Math.floor(Math.random() * product.stocks.length);
        return product.stocks[randomIndex];
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

    function handleSpin(): void {
        if (isSpinning || !sliderRef.current) return;

        setIsSpinning(true);
        setSelectedStock(null);

        const winningStock = getRandomStock();
        const winningIndex = product ? product.stocks.findIndex(stock => stock.symbol === winningStock.symbol) : -1;

        if (winningIndex === -1) {
            console.error("Winning stock not found in the list!");
            setIsSpinning(false);
            return;
        }

        const totalSpins = 5;
        const totalStocks = product ? product.stocks.length : 0;

        const totalSlidesToMove = (totalSpins * totalStocks) + winningIndex;

        sliderRef.current.slickGoTo(0, true);

        setTimeout(() => {
            sliderRef.current?.slickGoTo(totalSlidesToMove, false);

            setTimeout(() => {
                setSelectedStock(winningStock);
                setIsSpinning(false);
            }, 4000);
        }, 100);
    }

    const getRarityColor = (price: number) => {
        if (price > 500) return "from-red-500 to-red-700";
        if (price > 200) return "from-pink-500 to-pink-700";
        if (price > 100) return "from-purple-500 to-purple-700";
        if (price > 50) return "from-blue-500 to-blue-700";
        return "from-gray-500 to-gray-700";
    };

    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .slick-slide {
                transition: transform 0.5s ease-in-out;
            }
            .spinning .slick-track {
                transition: transform 4s cubic-bezier(0.1, 0.7, 0.2, 1) !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

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
                <div className="p-4">
                    <Link
                        href="/lootbox"
                        className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back to Cases
                    </Link>
                </div>

                <div className="container mx-auto">
                    {/* Case Info */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">{product.category}</h1>
                        <p className="text-gray-400">Contains {product.stocks.length} possible stocks</p>
                    </div>
                    {/* Selected Item Display */}
                    {selectedStock && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mb-8 text-center"
                        >
                            <div className={`inline-block bg-gradient-to-b ${getRarityColor(selectedStock.regularMarketPrice)} 
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
                                    {selectedStock.symbol}
                                </motion.div>
                                <div className="text-xl text-gray-200 mb-3 font-medium">
                                    {selectedStock.shortName}
                                </div>
                                <div className="text-3xl font-bold text-green-400">
                                    ${selectedStock.regularMarketPrice}
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
                                        product.stocks.map((stock: StockData, stockIndex: number) => (
                                            <div key={`${repeatIndex}-${stockIndex}`} className="px-2">
                                                <div className="w-full h-36 flex items-center justify-center rounded-lg border 
                                bg-gray-900/60 backdrop-blur-md shadow-lg shadow-gray-900/40 
                                border-gray-600 transition-all duration-300 hover:scale-105">
                                                    <div className="text-center p-4">
                                                        <div className="font-bold text-xl text-white/90 mb-1">{stock.symbol}</div>
                                                        <div className="text-sm text-gray-400 mb-2">{stock.shortName}</div>
                                                        <div className="text-green-400 font-semibold text-lg">
                                                            ${stock.regularMarketPrice}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ))}
                                </Slider>
                            </div>
                        </div>

                        {/* Spin Button */}
                        <motion.button
                            onClick={handleSpin}
                            disabled={isSpinning}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
            mt-8 px-12 py-4 rounded-lg mx-auto block
            bg-gradient-to-r from-yellow-500 to-yellow-600
            hover:from-yellow-400 hover:to-yellow-500
            text-gray-900 font-bold text-xl uppercase tracking-wider
            transition-all transform
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg shadow-yellow-500/30 hover:shadow-yellow-400/40
          `}
                        >
                            {isSpinning ? (
                                <span className="flex items-center gap-2">
                                    <motion.span
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >⚡</motion.span>
                                    Opening Case...
                                </span>
                            ) : (
                                'Open Case'
                            )}
                        </motion.button>
                    </section>


                    {/* Possible Items Section*/}
                    <section className="mt-16">
                        <h2 className="text-xl font-bold mb-6 text-center">Possible Stocks</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {product.stocks.map((stock: StockData, index: number) => (
                                <div
                                    key={index}
                                    className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 
                                        p-4 rounded-lg border border-gray-700
                                        hover:border-gray-600 transition-all duration-200
                                        transform hover:scale-[1.02] hover:shadow-lg"
                                >
                                    <div className="font-bold text-lg mb-1">{stock.symbol}</div>
                                    <div className="text-gray-400 text-sm mb-2">{stock.shortName}</div>
                                    <div className="text-green-400 font-semibold">
                                        ${stock.regularMarketPrice}
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
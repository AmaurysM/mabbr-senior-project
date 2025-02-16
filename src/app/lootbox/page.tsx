import React from 'react'
import { lootboxes } from '../constants/LootBoxDataTest'
import LootboxTile from '../components/LootboxTile'
import Link from 'next/link';


const Page = () => {
    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Lootboxes
                    </h1>
                    <p className="text-gray-400">
                        Discover and collect unique stock combinations
                    </p>
                </div>

                {/* Masonry Layout Container */}
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                    {lootboxes.map((box, index) => (
                        <Link
                            href={"/lootbox/"+ box.id}
                            key={index}
                            className="break-inside-avoid transform hover:scale-[1.02] transition-transform duration-200"
                        >
                            <div className="relative w-full pb-4">
                                <LootboxTile {...box} />
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Optional: Empty State */}
                {lootboxes.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg">
                            No lootboxes available at the moment
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Page
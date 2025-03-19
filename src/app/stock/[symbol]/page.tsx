"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { FaHammer } from "react-icons/fa"; 

const StockPage = () => {
  const { symbol } = useParams();
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <div className="w-full max-w-4xl bg-gray-300 rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          Stock: <span className="text-blue-500">{symbol}</span>
        </h1>
        <p className="text-gray-600 mt-2">This page is currently under construction.</p>
      </div>

      {/* Under Construction Icon */}
      <div className="flex flex-col items-center justify-center mb-6">
        <FaHammer className="text-gray-500 text-6xl mb-4" />
        <p className="text-gray-600 text-lg">Under Construction</p>
      </div>

      {/* Go Back Button */}
      <button
        onClick={() => router.push("/note")}
        className="mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Go back to notes
      </button>
    </div>
  );
};

export default StockPage;

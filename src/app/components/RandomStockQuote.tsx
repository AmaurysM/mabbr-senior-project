"use client";

import React, { useState, useEffect } from "react";



const RandomStockQuote: React.FC = () => {
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch("/api/quote");

        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();

        if (data?.text && data?.author) {
          setQuote({ text: data.text, author: data.author });
        } else {
          throw new Error("Invalid quote structure");
        }
      } catch (err) {
        console.error("Falling back to local quote:", err);
        setQuote(null);
      }
    };

    fetchQuote();
  }, []);

  if (!quote) {
    return <p className="mt-8 text-center text-gray-700">Loading quote...</p>;
  }

  return (
    <div className="mt-8 text-center text-gray-700">
      <p className="italic">&quot;{quote.text}&quot;</p>
      <p className="mt-2 font-semibold">- {quote.author}</p>
    </div>
  );
};

export default RandomStockQuote;

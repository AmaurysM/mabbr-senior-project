"use client";

import React, { useState, useEffect } from 'react';

const fallbackQuotes = [
    {
        text: "An investment in knowledge pays the best interest.",
        author: "Benjamin Franklin",
    },
    {
        text: "Be fearful when others are greedy and greedy only when others are fearful.",
        author: "Warren Buffett",
    },
    {
        text: "The stock market is filled with individuals who know the price of everything, but the value of nothing.",
        author: "Phillip Fisher",
    },
    {
        text: "In investing, what is comfortable is rarely profitable.",
        author: "Robert Arnott",
    },
    {
        text: "The individual investor should act consistently as an investor and not as a speculator.",
        author: "Ben Graham",
    },
];

const RandomStockQuote: React.FC = () => {
    const [quote, setQuote] = useState({ text: '', author: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const response = await fetch('https://api.quotable.io/quotes/random?tags=business|success|motivational');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data && data.length > 0) {
                    setQuote({ text: data[0].content, author: data[0].author });
                } else {
                    throw new Error('No quotes received');
                }
            } catch (error) {
                console.error('Error fetching quote:', error);
                setError(true);
                // Select a random fallback quote
                const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
                setQuote(fallbackQuotes[randomIndex]);
            } finally {
                setLoading(false);
            }
        };
        fetchQuote();
    }, []);

    if (loading) {
        return <p className="mt-8 text-center text-gray-700">Loading quote...</p>;
    }

    if (error) {
        return (
            <div className="mt-8 text-center text-gray-700">
                <p className="italic">"{quote.text}"</p>
                <p className="mt-2 font-semibold">- {quote.author}</p>
                <p className="text-sm text-red-500 mt-2">Unable to fetch new quote, showing a default one.</p>
            </div>
        );
    }

    return (
        <div className="mt-8 text-center text-gray-700">
            <p className="italic">"{quote.text}"</p>
            <p className="mt-2 font-semibold">- {quote.author}</p>
        </div>
    );
};

export default RandomStockQuote;
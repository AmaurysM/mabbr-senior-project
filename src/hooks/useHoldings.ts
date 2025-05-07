import { UserStocks } from '@/lib/prisma_types';
import { User } from "better-auth";
import { useState, useEffect, useCallback } from "react";

export const useHoldings = () => {
  // const [holdings, setHoldings] = useState<UserStocks>();
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState("");

  // useEffect(() => {
  //   const fetchHoldings = async () => {
  //     try {
  //       const res = await fetch("/api/user/holdings");
  //       const data:UserStocks = await res.json();
  //       console.log(data + "What we are returning. -0-00-0-0-00-0-0---0-0-")

  //       setHoldings(data);
  //     } catch (err) {
  //       setError("Failed to load user holdings");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchHoldings();
  // });

    const [holdings, setHoldings] = useState<UserStocks>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    const fetchHoldings = useCallback(async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/holdings");
        if (!response.ok) throw new Error("Failed to fetch transactions");
        const data: UserStocks = await response.json();
        setHoldings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    }, []);
  
    useEffect(() => {
      fetchHoldings();
    }, [fetchHoldings]);

  return { holdings, loading, error };
};

import { useState, useEffect } from "react";

export const useHoldings = () => {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const res = await fetch("/api/user/holdings");
        const data = await res.json();

        setHoldings(Array.isArray(data.holdings) ? data.holdings : []);
      } catch (err) {
        setError("Failed to load user holdings");
      } finally {
        setLoading(false);
      }
    };
    fetchHoldings();
  }, []);

  return { holdings, loading, error };
};

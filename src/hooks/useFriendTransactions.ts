import { useState, useEffect } from "react";

export const useFriendTransactions = () => {
  const [friendTransactions, setFriendTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/friendTransactions");
        const data = await res.json();

        
        setFriendTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      } catch (err) {
        setError("Failed to load friend transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { friendTransactions, loading, error };
};

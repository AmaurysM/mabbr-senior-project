import { UserTransactions } from "@/lib/prisma_types";
import { useState, useEffect } from "react";

export const useFriendTransactions = () => {
  const [friendTransactions, setFriendTransactions] = useState<UserTransactions>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/friendTransactions");
        const data: UserTransactions = await res.json();
        console.log("9989898989989898989889899898 data" + data)

        setFriendTransactions(Array.isArray(data) ? data : []);
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

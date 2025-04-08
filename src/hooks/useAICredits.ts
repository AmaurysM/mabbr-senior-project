import useSWR from 'swr';

interface AICreditsResponse {
  remainingCredits: number;
  totalCredits: number;
  usageCount: number;
}

const fetcher = async (url: string): Promise<AICreditsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch AI credits');
  }
  return response.json();
};

export function useAICredits() {
  const { data, error, isLoading, mutate } = useSWR<AICreditsResponse>(
    '/api/user/ai-credits',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 5000, // Prevent multiple requests within 5 seconds
    }
  );

  return {
    remainingCredits: data?.remainingCredits ?? 0,
    totalCredits: data?.totalCredits ?? 0,
    usageCount: data?.usageCount ?? 0,
    isLoading,
    error,
    mutate,
  };
} 
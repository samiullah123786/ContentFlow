import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

type FetchOptions = {
  table: string;
  select?: string;
  eq?: { column: string; value: any };
  order?: { column: string; ascending: boolean };
  single?: boolean;
  limit?: number;
  joins?: string;
};

export function useSupabaseFetch<T>(options: FetchOptions) {
  const { toast } = useToast();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh?: boolean) => {
    if (forceRefresh) setIsLoading(true);
    try {
      let query = supabase.from(options.table).select(options.select || "*");

      if (options.eq) {
        query = query.eq(options.eq.column, options.eq.value);
      }

      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: queryError } = options.single
        ? await query.single()
        : await query;

      if (queryError) throw queryError;

      setData(result as T);
      setError(null);
    } catch (err) {
      console.error(`Error fetching data from ${options.table}:`, err);
      setError(err as Error);
      toast({
        variant: "destructive",
        title: `Error fetching ${options.table} data`,
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [options, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading: isLoading,
    error,
    refetch: (forceRefresh: boolean = true) => fetchData(forceRefresh)
  };
}
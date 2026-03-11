'use client';
import React, { useEffect, useState } from "react";
import { supabaseBrowser } from '@/lib/supabase';
import { Exchange } from "@/types/exchanges";
import EventsList from "../../../../components/user/EventList";
import { SearchBar } from "@/components/Search/SearchBar";
import { useRouter } from "next/navigation"; 


export default function ExchangesPage() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const supabase = supabaseBrowser();
  const router = useRouter();

  useEffect(() => {
    async function fetchExchanges() {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch("/api/admin/exchanges", { headers });
      const json = await res.json();
      setExchanges(json.data || []);
    }
    fetchExchanges();
  }, [supabase.auth]);

  return (
    <div className="max-w-5xl mx-auto mt-12">
      <SearchBar<Exchange>
        placeholder="Search exchanges..."
        apiEndpoint="/api/admin/exchanges"
        onResultClick={event => router.push(`/search?search_output=${encodeURIComponent(event.output_item_id)}`)}
        onSubmit={query => router.push(`/search?search_output=${encodeURIComponent(query)}`)}
        getAuthHeaders={async () => { 
          const { data } = await supabase.auth.getSession();
          const token = data?.session?.access_token;
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          return headers;
        }}
      />

      <h2 className="text-lg font-semibold mb-4">All Exchanges</h2>
      <EventsList events={exchanges} />
    </div>
  );
}
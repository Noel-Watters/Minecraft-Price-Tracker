import { Suspense } from "react";
import SearchResultsContent from "./SearchResults";

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div>Loading search results...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
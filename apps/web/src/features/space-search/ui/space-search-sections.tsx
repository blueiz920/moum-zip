"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

import { SearchHero } from "@/_pages/space-search";
import { useInfiniteSearchResults } from "../hooks/use-infinite-search-results";
import { useSearchQueryState } from "../hooks/use-search-query-state";
import { SEARCH_FILTERS } from "../model/constants";
import { normalizeSearchKeyword } from "../model/search-params";
import type { SearchCategory, SearchFilter, SearchQueryState } from "../model/types";
import { SearchKeywordBar } from "./space-search-keyword-bar";
import { SearchResults } from "./space-search-results";
import { SearchToolbar } from "./space-search-toolbar";

type SearchKeywordStatus = "idle" | "loading" | "success" | "error";

interface SearchContentSectionProps {
  queryState: SearchQueryState;
  children: ReactNode;
}

interface SearchDeferredContentSectionProps {
  categories: SearchCategory[];
  isAuthenticated: boolean;
}

interface SearchContentContextValue {
  activeQueryState: SearchQueryState;
  draftKeyword: string;
  handleCategoryChange: (categoryId: SearchQueryState["categoryId"]) => void;
  handleDateSortChange: (dateSortId: SearchQueryState["dateSortId"]) => void;
  handleDeadlineSortChange: (deadlineSortId: SearchQueryState["deadlineSortId"]) => void;
  handleFilterOpenChange: (filterId: SearchFilter["id"], nextIsOpen: boolean) => void;
  handleKeywordSubmit: () => void;
  handleLocationChange: (locationId: SearchQueryState["locationId"]) => void;
  handleResetFiltersForKeyword: (keyword: string) => void;
  keywordSearchStatus: SearchKeywordStatus;
  openedFilterId: SearchFilter["id"] | null;
  setDraftKeyword: Dispatch<SetStateAction<string>>;
  setKeywordSearchStatus: Dispatch<SetStateAction<SearchKeywordStatus>>;
}

const SearchContentContext = createContext<SearchContentContextValue | null>(null);

const useSearchContentContext = () => {
  const context = useContext(SearchContentContext);

  if (!context) {
    throw new Error("useSearchContentContext must be used within SearchContentSection.");
  }

  return context;
};

export const SearchContentSection = ({ children, queryState }: SearchContentSectionProps) => {
  const [draftKeyword, setDraftKeyword] = useState(queryState.keyword);
  const [keywordSearchStatus, setKeywordSearchStatus] = useState<SearchKeywordStatus>("idle");
  const [openedFilterId, setOpenedFilterId] = useState<SearchFilter["id"] | null>(null);
  const {
    activeQueryState,
    handleCategoryChange,
    handleDateSortChange,
    handleDeadlineSortChange,
    handleKeywordChange,
    handleLocationChange,
    handleResetFiltersForKeyword,
  } = useSearchQueryState({ queryState });

  useEffect(() => {
    setDraftKeyword(activeQueryState.keyword);
  }, [activeQueryState.keyword]);

  const handleKeywordSubmit = () => {
    const normalizedKeyword = normalizeSearchKeyword(draftKeyword);

    setDraftKeyword(normalizedKeyword);
    handleKeywordChange(normalizedKeyword);
  };

  const handleFilterOpenChange = (filterId: SearchFilter["id"], nextIsOpen: boolean) => {
    setOpenedFilterId((prevOpenedFilterId) => {
      if (nextIsOpen) {
        return filterId;
      }

      return prevOpenedFilterId === filterId ? null : prevOpenedFilterId;
    });
  };

  const contextValue: SearchContentContextValue = {
    activeQueryState,
    draftKeyword,
    handleCategoryChange,
    handleDateSortChange,
    handleDeadlineSortChange,
    handleFilterOpenChange,
    handleKeywordSubmit,
    handleLocationChange,
    handleResetFiltersForKeyword,
    keywordSearchStatus,
    openedFilterId,
    setDraftKeyword,
    setKeywordSearchStatus,
  };

  return (
    <SearchContentContext.Provider value={contextValue}>
      <div className="flex w-full min-w-80 flex-col gap-4 lg:gap-6">
        <SearchHero
          desktopSearchBar={
            <SearchKeywordBar
              className="w-124"
              keyword={draftKeyword}
              onKeywordChange={setDraftKeyword}
              onSubmit={handleKeywordSubmit}
              searchStatus={keywordSearchStatus}
              variant="hero"
            />
          }
        />
        {children}
      </div>
    </SearchContentContext.Provider>
  );
};

export const SearchDeferredContentSection = ({ categories, isAuthenticated }: SearchDeferredContentSectionProps) => {
  const {
    activeQueryState,
    draftKeyword,
    handleCategoryChange,
    handleDateSortChange,
    handleDeadlineSortChange,
    handleFilterOpenChange,
    handleKeywordSubmit,
    handleLocationChange,
    handleResetFiltersForKeyword,
    openedFilterId,
    setDraftKeyword,
    setKeywordSearchStatus,
  } = useSearchContentContext();
  const {
    errorMessage,
    hasMore,
    hasSearchQueryError,
    isFetched,
    isFetchingFirstPage,
    isFetchingNextPage,
    items,
    loadMoreRef,
  } = useInfiniteSearchResults({
    isAuthenticated,
    queryState: activeQueryState,
  });

  const nextKeywordSearchStatus =
    activeQueryState.keyword.length === 0
      ? "idle"
      : isFetchingFirstPage
        ? "loading"
        : hasSearchQueryError
          ? "error"
          : isFetched
            ? "success"
            : "idle";

  useEffect(() => {
    setKeywordSearchStatus(nextKeywordSearchStatus);
  }, [nextKeywordSearchStatus, setKeywordSearchStatus]);

  return (
    <div className="flex w-full flex-1 flex-col gap-4 px-4 sm:px-0 lg:gap-6">
      <SearchToolbar
        categories={categories}
        filters={SEARCH_FILTERS}
        keywordBar={
          <SearchKeywordBar
            keyword={draftKeyword}
            onKeywordChange={setDraftKeyword}
            onSubmit={handleKeywordSubmit}
            searchStatus={nextKeywordSearchStatus}
            variant="toolbar"
          />
        }
        onFilterOpenChange={handleFilterOpenChange}
        onCategoryChange={handleCategoryChange}
        onDateSortChange={handleDateSortChange}
        onDeadlineSortChange={handleDeadlineSortChange}
        onLocationChange={handleLocationChange}
        openedFilterId={openedFilterId}
        selectedCategoryId={activeQueryState.categoryId}
        selectedDateSortId={activeQueryState.dateSortId}
        selectedDeadlineSortId={activeQueryState.deadlineSortId}
        selectedLocationId={activeQueryState.locationId}
      />
      <SearchResults
        errorMessage={errorMessage}
        hasMore={hasMore}
        isFetchingFirstPage={isFetchingFirstPage}
        isFetchingNextPage={isFetchingNextPage}
        isAuthenticated={isAuthenticated}
        items={items}
        loadMoreRef={loadMoreRef}
        onResetFiltersForKeyword={handleResetFiltersForKeyword}
        queryState={activeQueryState}
      />
    </div>
  );
};

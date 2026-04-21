import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";

import { getSearchMetadata, type SearchMetadataParams } from "@/_pages/space-search/lib/get-search-metadata";
import { getSearchPrefetchContext } from "@/_pages/space-search/lib/get-search-prefetch-context";
import { getSearchCategories } from "@/_pages/space-search/use-cases/get-search-categories";
import {
  normalizeSearchQueryState,
  parseSearchQueryState,
  SearchContentLoadingFallback,
  SearchContentSection,
  SearchDeferredContentSection,
} from "@/features/space-search";
import { SearchCreateButton } from "@/features/space-search/ui/space-search-create-button";
import { getQueryClient } from "@/shared/lib/get-query-client";

interface SearchPageProps {
  searchParams?: Promise<SearchMetadataParams>;
}

const formatSearchLcpDebugMs = (value: number) => `${value.toFixed(1)}ms`;

interface SearchLcpDebugParams {
  debugRequestId: string;
  debugStartedAt: number;
  message: string;
  startedAt?: number;
}

interface SearchDeferredServerContentProps {
  debugRequestId: string;
  debugStartedAt: number;
  isAuthenticated: boolean;
}

const logSearchLcpDebug = ({ debugRequestId, debugStartedAt, message, startedAt }: SearchLcpDebugParams) => {
  const now = performance.now();
  const duration = typeof startedAt === "number" ? ` (duration ${formatSearchLcpDebugMs(now - startedAt)})` : "";

  // biome-ignore lint/suspicious/noConsole: temporary server timing log for the search LCP experiment.
  console.info(
    `[search-lcp-debug][req:${debugRequestId}] ${message} +${formatSearchLcpDebugMs(now - debugStartedAt)}${duration}`,
  );
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  return getSearchMetadata(searchParams);
}

async function SearchDeferredServerContent({
  debugRequestId,
  debugStartedAt,
  isAuthenticated,
}: SearchDeferredServerContentProps) {
  const categoriesStartedAt = performance.now();
  logSearchLcpDebug({ debugRequestId, debugStartedAt, message: "categories 시작" });
  const categories = await getSearchCategories();
  logSearchLcpDebug({ debugRequestId, debugStartedAt, message: "categories 완료", startedAt: categoriesStartedAt });

  return <SearchDeferredContentSection categories={categories} isAuthenticated={isAuthenticated} />;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const debugStartedAt = performance.now();
  const debugRequestId = Math.random().toString(36).slice(2, 8);

  const queryState = parseSearchQueryState(resolvedSearchParams);
  const normalizedQueryState = normalizeSearchQueryState(queryState);
  const queryClient = getQueryClient();

  const prefetchContextStartedAt = performance.now();
  logSearchLcpDebug({ debugRequestId, debugStartedAt, message: "prefetchContext 시작" });
  const { isAuthenticatedRequest, searchPrefetchQueryOptions } = await getSearchPrefetchContext({
    queryState: normalizedQueryState,
  });
  logSearchLcpDebug({
    debugRequestId,
    debugStartedAt,
    message: "prefetchContext 완료",
    startedAt: prefetchContextStartedAt,
  });

  // Start search prefetch early, but do not block the hero render path on search results.
  const searchPrefetchStartedAt = performance.now();
  logSearchLcpDebug({ debugRequestId, debugStartedAt, message: "searchPrefetch 시작" });
  void queryClient
    .prefetchInfiniteQuery(searchPrefetchQueryOptions)
    .then(() => {
      logSearchLcpDebug({
        debugRequestId,
        debugStartedAt,
        message: "searchPrefetch 완료",
        startedAt: searchPrefetchStartedAt,
      });
    })
    .catch((error: unknown) => {
      logSearchLcpDebug({
        debugRequestId,
        debugStartedAt,
        message: "searchPrefetch 실패",
        startedAt: searchPrefetchStartedAt,
      });
      // biome-ignore lint/suspicious/noConsole: temporary server timing log for the search LCP experiment.
      console.error(`[search-lcp-debug][req:${debugRequestId}] searchPrefetch error`, { error });
    });
  logSearchLcpDebug({ debugRequestId, debugStartedAt, message: "page shell return 직전" });

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex w-full min-w-80 max-w-7xl flex-col gap-6 pt-6 pb-24 sm:px-6 lg:max-w-6xl lg:gap-8 lg:pt-6.75 2xl:max-w-7xl">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <SearchContentSection queryState={queryState}>
            <Suspense fallback={<SearchContentLoadingFallback />}>
              <SearchDeferredServerContent
                debugRequestId={debugRequestId}
                debugStartedAt={debugStartedAt}
                isAuthenticated={isAuthenticatedRequest}
              />
            </Suspense>
          </SearchContentSection>
        </HydrationBoundary>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 sm:bottom-8">
        <div className="mx-auto flex w-full max-w-7xl justify-end px-4 sm:px-6 lg:max-w-6xl 2xl:max-w-7xl">
          <SearchCreateButton
            aria-label="스페이스 만들기"
            className="pointer-events-auto sm:hidden"
            isAuthenticated={isAuthenticatedRequest}
            variant="icon"
          />
          <SearchCreateButton
            className="pointer-events-auto hidden sm:inline-flex lg:h-14 lg:min-w-43 lg:px-5 lg:text-lg 2xl:h-16 2xl:min-w-47 2xl:px-6 2xl:text-xl"
            isAuthenticated={isAuthenticatedRequest}
          >
            스페이스 만들기
          </SearchCreateButton>
        </div>
      </div>
    </div>
  );
}

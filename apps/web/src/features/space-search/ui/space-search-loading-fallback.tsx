import { SpaceCardSkeleton } from "./space-card-skeleton";

export const SearchContentLoadingFallback = () => {
  return (
    <div className="flex w-full flex-1 flex-col gap-4 px-4 sm:px-0 lg:gap-6">
      <section className="grid w-full min-w-80 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:flex lg:items-center lg:justify-between">
        <div className="flex w-full min-w-80 flex-wrap items-center gap-2 pb-1">
          {["all", "study", "project"].map((id) => (
            <div className="h-9 w-18 animate-pulse rounded-full bg-muted motion-reduce:animate-none" key={id} />
          ))}
        </div>
        <div className="flex w-full min-w-80 flex-nowrap items-center gap-x-1.5 overflow-hidden sm:flex-wrap sm:justify-center sm:gap-y-1 sm:overflow-visible lg:justify-end">
          {["date", "location", "deadline"].map((id) => (
            <div className="h-9 w-24 animate-pulse rounded-full bg-muted motion-reduce:animate-none" key={id} />
          ))}
        </div>
        <div className="flex w-full min-w-80 justify-end sm:col-span-2 lg:hidden">
          <div className="h-12 w-full min-w-80 animate-pulse rounded-full bg-muted motion-reduce:animate-none sm:min-w-0" />
        </div>
      </section>
      <section className="flex flex-col gap-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {["first", "second", "third", "fourth"].map((id) => (
            <SpaceCardSkeleton key={id} />
          ))}
        </div>
      </section>
    </div>
  );
};

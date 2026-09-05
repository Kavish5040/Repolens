import React, { Suspense } from "react";
import { DashboardContainer } from "@/components/DashboardContainer.tsx";
import { LoadingSkeleton } from "@/components/states/LoadingSkeleton.tsx";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-8">
          <LoadingSkeleton />
        </div>
      }
    >
      <DashboardContainer />
    </Suspense>
  );
}

"use client";

import { useEffect } from "react";

// Only import on server startup
if (typeof window === "undefined") {
  import("@/lib/cron").then(({ startCron }) => {
    startCron();
  });
}

export default function Providers({ children }) {
  useEffect(() => {
    console.log("Providers mounted");
  }, []);

  return children;
}

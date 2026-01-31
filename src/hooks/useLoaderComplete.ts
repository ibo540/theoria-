"use client";

import { useEffect, useState } from "react";

/**
 * Hook to track when the loader animation is complete
 * Listens to the 'loader-complete' event dispatched by the Loader component
 */
export function useLoaderComplete() {
  const [isLoaderComplete, setIsLoaderComplete] = useState(false);

  useEffect(() => {
    const handleLoaderComplete = () => {
      setIsLoaderComplete(true);
    };

    // Listen for the loader-complete event
    window.addEventListener("loader-complete", handleLoaderComplete);

    return () => {
      window.removeEventListener("loader-complete", handleLoaderComplete);
    };
  }, []);

  return isLoaderComplete;
}



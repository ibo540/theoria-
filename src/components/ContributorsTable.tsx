"use client";

import { useEffect, useState } from "react";
import { fetchContributors, Contributor } from "@/lib/contributor-utils";
import { User } from "lucide-react";

const COLORS = {
  gold: "var(--primary-gold)",
  background: "var(--dark)",
} as const;

interface ContributorsTableProps {
  className?: string;
}

export default function ContributorsTable({ className = "" }: ContributorsTableProps) {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContributors();
    // Refresh contributors every 30 seconds
    const interval = setInterval(loadContributors, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadContributors = async () => {
    setIsLoading(true);
    try {
      const data = await fetchContributors();
      // Filter out admins and only show contributors
      const contributorsOnly = data.filter((c) => c.role === "contributor");
      setContributors(contributorsOnly);
    } catch (error) {
      console.error("Error loading contributors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) {
      // First place - Elegant filled diamond in gold
      return (
        <div
          className="flex items-center justify-center"
          style={{ width: "24px", height: "24px" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L16 10L24 12L16 14L12 22L8 14L0 12L8 10L12 2Z"
              fill={COLORS.gold}
              opacity="0.95"
            />
          </svg>
        </div>
      );
    } else if (index === 1) {
      // Second place - Minimal double circle in silver
      return (
        <div
          className="flex items-center justify-center"
          style={{ width: "24px", height: "24px" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="#B8B8B8"
              strokeWidth="1.5"
              opacity="0.85"
            />
            <circle
              cx="12"
              cy="12"
              r="5"
              fill="none"
              stroke="#B8B8B8"
              strokeWidth="1.5"
              opacity="0.85"
            />
          </svg>
        </div>
      );
    } else if (index === 2) {
      // Third place - Elegant square with corner accent in bronze
      return (
        <div
          className="flex items-center justify-center"
          style={{ width: "24px", height: "24px" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              rx="2"
              fill="none"
              stroke="#CD7F32"
              strokeWidth="1.5"
              opacity="0.75"
            />
            <path
              d="M4 4L12 12M20 4L12 12"
              stroke="#CD7F32"
              strokeWidth="1.5"
              opacity="0.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    }
    return (
      <span
        className="text-lg font-light"
        style={{
          color: COLORS.gold,
          opacity: 0.6,
          minWidth: "24px",
          textAlign: "center",
        }}
      >
        {index + 1}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div
          className="text-base font-light"
          style={{
            color: COLORS.gold,
            opacity: 0.7,
            letterSpacing: "0.02em",
          }}
        >
          Loading contributors...
        </div>
      </div>
    );
  }

  if (contributors.length === 0) {
    return (
      <div className={className}>
        <h2
          className="text-2xl font-light mb-6"
          style={{
            letterSpacing: "0.03em",
            opacity: 0.9,
            color: COLORS.gold,
          }}
        >
          Contributors
        </h2>
        <div
          className="text-base font-light py-4"
          style={{
            color: COLORS.gold,
            opacity: 0.7,
            letterSpacing: "0.02em",
          }}
        >
          No contributors yet. Be the first to contribute!
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2
        className="text-2xl font-light mb-6"
        style={{
          letterSpacing: "0.03em",
          opacity: 0.9,
          color: COLORS.gold,
        }}
      >
        Contributors
      </h2>

      <div className="space-y-3">
        {contributors.map((contributor, index) => (
          <div
            key={contributor.id || contributor.username}
            className="flex items-center justify-between py-4 px-6 rounded-lg border transition-all hover:bg-opacity-5"
            style={{
              borderColor: `${COLORS.gold}30`,
              backgroundColor:
                index < 3 ? `${COLORS.gold}05` : "transparent",
            }}
          >
            <div className="flex items-center gap-4 flex-1">
              {/* Rank Icon/Number */}
              <div className="flex items-center justify-center w-8">
                {getRankIcon(index)}
              </div>

              {/* Contributor Name */}
              <div className="flex items-center gap-3 flex-1">
                <User
                  className="w-5 h-5"
                  style={{
                    color: COLORS.gold,
                    opacity: 0.7,
                  }}
                />
                <p
                  className="text-xl font-light"
                  style={{
                    letterSpacing: "0.02em",
                    opacity: index < 3 ? 0.95 : 0.85,
                    color: COLORS.gold,
                  }}
                >
                  {contributor.name}
                </p>
              </div>
            </div>

            {/* Event Count */}
            <div className="flex items-center gap-2">
              <span
                className="text-lg font-light"
                style={{
                  color: COLORS.gold,
                  opacity: 0.8,
                  letterSpacing: "0.02em",
                }}
              >
                {contributor.event_count || 0}
              </span>
              <span
                className="text-sm font-light"
                style={{
                  color: COLORS.gold,
                  opacity: 0.6,
                  letterSpacing: "0.02em",
                }}
              >
                {contributor.event_count === 1 ? "event" : "events"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

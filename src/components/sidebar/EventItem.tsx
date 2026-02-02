import React from "react";
import { EventData } from "@/data/events";
import { SIDEBAR_TYPOGRAPHY } from "./typography";
import { Loader2 } from "lucide-react";

interface EventItemProps {
  event: EventData;
  isActive: boolean;
  isLoading?: boolean;
  onClick: () => void;
}

export default function EventItem({
  event,
  isActive,
  isLoading = false,
  onClick,
}: EventItemProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      disabled={isLoading}
      className={`
        group relative w-full text-left border-2 transition-all duration-300 ease-out
        ${
          isLoading
            ? "cursor-wait opacity-75"
            : "cursor-pointer"
        }
        ${
          isActive
            ? "border-primary-gold scale-[1.02] shadow-lg shadow-primary-gold/20"
            : "border-primary-gold/20 hover:scale-[1.01] hover:border-primary-gold/40"
        }
      `}
    >
      {/* Background with blur and effects */}
      <div
        className={`
          absolute inset-0 backdrop-blur-sm transition-all duration-300
          ${
            isActive
              ? "bg-primary-gold/20"
              : "bg-black/25 group-hover:bg-primary-gold/8"
          }
        `}
        style={{
          backgroundImage: isActive
            ? "radial-gradient(circle at center, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.1) 50%, transparent 80%)"
            : "radial-gradient(circle at 50% 0%, rgba(255, 228, 190, 0.1) 0%, transparent 70%)",
        }}
      />

      {/* Active indicator border glow */}
      {isActive && (
        <div className="absolute inset-0 border-2 border-primary-gold/40 animate-pulse pointer-events-none" />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
          <Loader2 className="w-6 h-6 text-primary-gold animate-spin" />
        </div>
      )}

      {/* Content */}
      <div className={`relative p-5 space-y-3 ${isLoading ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h3
            className={`${SIDEBAR_TYPOGRAPHY.eventItem.title} transition-colors ${
              isActive
                ? "text-primary-gold"
                : "text-primary-gold/90 group-hover:text-primary-gold"
            }`}
          >
            {event.title}
          </h3>
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 border transition-all
              ${
                isActive
                  ? "bg-primary-gold/20 border-primary-gold/50 text-primary-gold"
                  : "bg-black/30 border-primary-gold/20 text-primary-gold/60 group-hover:bg-primary-gold/10 group-hover:border-primary-gold/30"
              }
            `}
          >
            <span className={SIDEBAR_TYPOGRAPHY.eventItem.date}>{event.date}</span>
          </div>
        </div>
        <p
          className={`${SIDEBAR_TYPOGRAPHY.eventItem.description} transition-colors ${
            isActive
              ? "text-primary-gold/70"
              : "text-primary-gold/50 group-hover:text-primary-gold/60"
          }`}
        >
          {event.description}
        </p>
      </div>
    </button>
  );
}

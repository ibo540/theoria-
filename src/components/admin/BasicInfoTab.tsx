"use client";

import { EventData } from "@/data/events";
import { RichTextEditor } from "./RichTextEditor";

interface BasicInfoTabProps {
  event: Partial<EventData>;
  setEvent: (event: Partial<EventData>) => void;
}

export function BasicInfoTab({ event, setEvent }: BasicInfoTabProps) {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
      <div className="border-b border-slate-600/50 pb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Basic Information</h2>
        <p className="text-sm text-gray-300 mt-2">Start by filling in the essential details about your event.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2.5">
          <label className="block text-sm font-medium text-gray-200">
            Event ID (URL Slug) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={event.id || ""}
              onChange={(e) => setEvent({ ...event, id: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600/50 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:border-slate-500 text-white placeholder:text-gray-400"
              placeholder="cold-war"
            />
          </div>
          <p className="text-[13px] text-gray-400">Used in URLs. Use lowercase with hyphens (e.g., "cold-war")</p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-200">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={event.title || ""}
            onChange={(e) => setEvent({ ...event, title: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600/50 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:border-slate-500 text-white placeholder:text-gray-400"
            placeholder="The Cold War"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-200">
            Date <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={event.date || ""}
            onChange={(e) => setEvent({ ...event, date: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600/50 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:border-slate-500 text-white placeholder:text-gray-400"
            placeholder="1947-1991"
          />
          <p className="text-[11px] sm:text-xs text-gray-400">Human-readable format (e.g., "1947-1991" or "March 12, 1947")</p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-200">Event Type</label>
          <select
            value={event.kind || "event"}
            onChange={(e) => setEvent({ ...event, kind: e.target.value as any })}
            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600/50 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:border-slate-500 text-white"
          >
            <option value="event">Event</option>
            <option value="era">Era</option>
            <option value="crisis">Crisis</option>
            <option value="formation">Formation</option>
            <option value="war">War</option>
            <option value="treaty">Treaty</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-gray-200">Summary</label>
        <p className="text-[11px] sm:text-xs text-gray-400 mb-1.5">Brief 1-2 sentence summary for cards and previews</p>
        <textarea
          value={event.summary || ""}
          onChange={(e) => setEvent({ ...event, summary: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600/50 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:border-slate-500 text-white placeholder:text-gray-400 resize-none"
          placeholder="Geopolitical rivalry between the United States and the Soviet Union..."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-gray-200">
          Description <span className="text-red-400">*</span>
        </label>
        <p className="text-[11px] sm:text-xs text-gray-400 mb-1.5">Medium description (1 paragraph) for main displays</p>
        <div className="prose-admin-editor rounded-lg overflow-hidden border border-slate-600/50 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <RichTextEditor
            content={event.description || ""}
            onChange={(content) => setEvent({ ...event, description: content })}
            placeholder="A period of geopolitical tension..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-gray-200">
          Full Description <span className="text-red-400">*</span>
        </label>
        <p className="text-[11px] sm:text-xs text-gray-400 mb-1.5">Full description (multiple paragraphs) for detail views</p>
        <div className="prose-admin-editor rounded-lg overflow-hidden border border-slate-600/50 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <RichTextEditor
            content={event.fullDescription || ""}
            onChange={(content) => setEvent({ ...event, fullDescription: content })}
            placeholder="The Cold War was a period of geopolitical tension..."
          />
        </div>
      </div>
    </div>
  );
}

import type { InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  borderStyle?: "three" | "four" | "five";
  onClear?: () => void;
}

const borderConfigs = {
  three: {
    borderImageSource: "url('/assets/buttons/buttone-3.png')",
    borderImageSlice: "300 300 300 300",
    borderImageWidth: "25px",
    border: "25px solid transparent",
    inset: "0px",
  },
  four: {
    borderImageSource: "url('/assets/buttons/button-4.png')",
    borderImageSlice: "300 300 300 300",
    borderImageWidth: "25px",
    border: "25px solid transparent",
    inset: "10px",
  },
  five: {
    borderImageSource: "url('/assets/buttons/button-5.png')",
    borderImageSlice: "300 300 300 300",
    borderImageWidth: "25px",
    border: "25px solid transparent",
    inset: "10px",
  },
};

export default function SearchInput({
  className,
  borderStyle = "four",
  placeholder = "Search...",
  value,
  onChange,
  onClear,
  ...props
}: SearchInputProps) {
  const config = borderConfigs[borderStyle];

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      const syntheticEvent = {
        target: { value: "" },
        currentTarget: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  const hasValue = value && String(value).length > 0;

  return (
    <div
      className={cn("relative", className)}
      style={{
        border: config.border,
        borderImageSource: config.borderImageSource,
        borderImageSlice: config.borderImageSlice,
        borderImageRepeat: "round",
        borderImageWidth: config.borderImageWidth,
      }}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          "relative pl-10 pr-10 w-full text-xl bg-transparent text-primary-gold/90 placeholder:text-primary-gold/40 focus:outline-none transition-colors duration-200"
        )}
        {...props}
      />
      <Search
        className="absolute top-1/2 -translate-y-1/2 text-primary-gold pointer-events-none"
        size={18}
      />

      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-primary-gold transition-colors"
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

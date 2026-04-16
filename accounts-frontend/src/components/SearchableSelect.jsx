import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Search...",
}) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isInitialized, setIsInitialized] = useState(false);

  const wrapperRef = useRef(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showDropdown) setActiveIndex(-1);
  }, [showDropdown]);

  useEffect(() => {
    if (!value || value === "") {
      setQuery("");
      prevValueRef.current = "";
      setIsInitialized(false);
      return;
    }

    if (value && typeof value === 'string' && options.length > 0) {
      // Only update if value has changed
      if (value !== prevValueRef.current) {
        const selected = options.find((opt) => opt.value === value);
        if (selected) {
          setQuery(selected.label);
          prevValueRef.current = value;
          setIsInitialized(true);
        } else {
          setQuery("");
          prevValueRef.current = "";
        }
      }
    }
  }, [value, options]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);

    if (val.trim().length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      if (value) {
        onChange({ value: "", label: "" });
      }
    }
  };

  const handleSelectOption = (option) => {
    setQuery(option.label);
    onChange(option);
    setShowDropdown(false);
    setIsInitialized(true);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        value={query}
        placeholder={placeholder}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (!showDropdown) return;

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
          }

          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) =>
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
          }

          if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0) {
              const selected = filteredOptions[activeIndex];
              handleSelectOption(selected);
            }
          }

          if (e.key === "Escape") {
            setShowDropdown(false);
          }
        }}
      />

      {showDropdown && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-auto shadow-lg">
          {filteredOptions.map((opt, index) => (
            <div
              key={opt.value}
              className={`px-3 py-2 cursor-pointer ${
                index === activeIndex
                  ? "bg-accent text-black"
                  : "hover:bg-blue-100"
              }`}
              onClick={() => handleSelectOption(opt)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}

      {showDropdown && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 p-2 text-sm text-gray-500">
          No results found
        </div>
      )}
    </div>
  );
}
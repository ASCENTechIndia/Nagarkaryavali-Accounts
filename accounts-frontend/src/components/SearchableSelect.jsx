// import { useState, useRef, useEffect } from "react";
// import { Input } from "@/components/ui/input";

// export default function SearchableSelect({
//   options = [],
//   value,
//   onChange,
//   placeholder = "Search...",
//   disabled = false,
// }) {
//   const [query, setQuery] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [activeIndex, setActiveIndex] = useState(-1);
//   const [isInitialized, setIsInitialized] = useState(false);

//   const wrapperRef = useRef(null);
//   const prevValueRef = useRef(value);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
//         setShowDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     if (showDropdown) setActiveIndex(-1);
//   }, [showDropdown]);

//   useEffect(() => {
//     if (!value || value === "") {
//       setQuery("");
//       prevValueRef.current = "";
//       setIsInitialized(false);
//       return;
//     }

//     if (value && typeof value === 'string' && options.length > 0) {
//       // Only update if value has changed
//       if (value !== prevValueRef.current) {
//         const selected = options.find((opt) => opt.value === value);
//         if (selected) {
//           setQuery(selected.label);
//           prevValueRef.current = value;
//           setIsInitialized(true);
//         } else {
//           setQuery("");
//           prevValueRef.current = "";
//         }
//       }
//     }
//   }, [value, options]);

//   const filteredOptions = options.filter((opt) =>
//     opt.label.toLowerCase().includes(query.toLowerCase())
//   );

//   const handleInputChange = (e) => {
//     if (disabled) return;

//     const val = e.target.value;
//     setQuery(val);
//     setActiveIndex(-1);

//     if (val.trim().length > 0) {
//       setShowDropdown(true);
//     } else {
//       setShowDropdown(false);
//       if (value) {
//         onChange({ value: "", label: "" });
//       }
//     }
//   };

//   const handleSelectOption = (option) => {
//     if (disabled) return;
//     setQuery(option.label);
//     onChange(option);
//     setShowDropdown(false);
//     setIsInitialized(true);
//   };

//   return (
//     <div ref={wrapperRef} className={`relative w-full ${
//       disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
//     }`}>
//       <Input
//         value={query}
//         placeholder={placeholder}
//         onChange={handleInputChange}
//         disabled={disabled}
//         onKeyDown={(e) => {
//           if (!showDropdown) return;

//           if (e.key === "ArrowDown") {
//             e.preventDefault();
//             setActiveIndex((prev) =>
//               prev < filteredOptions.length - 1 ? prev + 1 : 0
//             );
//           }

//           if (e.key === "ArrowUp") {
//             e.preventDefault();
//             setActiveIndex((prev) =>
//               prev > 0 ? prev - 1 : filteredOptions.length - 1
//             );
//           }

//           if (e.key === "Enter") {
//             e.preventDefault();
//             if (activeIndex >= 0) {
//               const selected = filteredOptions[activeIndex];
//               handleSelectOption(selected);
//             }
//           }

//           if (e.key === "Escape") {
//             setShowDropdown(false);
//           }
//         }}
//       />

//       {showDropdown && filteredOptions.length > 0 && (
//         <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-auto shadow-lg">
//           {filteredOptions.map((opt, index) => (
//             <div
//               key={opt.value}
//               className={`px-3 py-2 cursor-pointer ${
//                 index === activeIndex
//                   ? "bg-accent text-black"
//                   : "hover:bg-blue-100"
//               }`}
//               onClick={() => handleSelectOption(opt)}
//             >
//               {opt.label}
//             </div>
//           ))}
//         </div>
//       )}

//       {showDropdown && filteredOptions.length === 0 && (
//         <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 p-2 text-sm text-gray-500">
//           No results found
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
  loading = false,
  loadingMessage = "Loading...",
}) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const prevValueRef = useRef(value);
  const searchTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const isLoading = loading || (isSearching && options.length === 0);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    
    const lowerQuery = query.toLowerCase();
    return options.filter((opt) => 
      opt.label.toLowerCase().includes(lowerQuery)
    );
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value === prevValueRef.current) return;
    
    if (!value || value === "") {
      if (!isTypingRef.current) {
        setQuery("");
      }
      prevValueRef.current = value;
      return;
    }

    if (options.length > 0 && typeof value === 'string') {
      const selected = options.find((opt) => opt.value === value);
      if (selected && selected.label !== query) {
        setQuery(selected.label);
      } else if (!selected && query !== "") {
        setQuery("");
      }
      prevValueRef.current = value;
    }
  }, [value, options, query]);

  useEffect(() => {
    if (!query.trim()) {
      const timer = setTimeout(() => {
        setShowDropdown(false);
        setIsSearching(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [query]);

  useEffect(() => {
    if (options.length === 0 && query.trim() && !loading) {
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 500);
      return () => clearTimeout(timer);
    } else if (options.length > 0 && isSearching) {
      setIsSearching(false);
    }
  }, [options, query, loading]);

  const handleInputChange = useCallback((e) => {
    if (disabled) return;
    
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);
    isTypingRef.current = true;
    
    if (val.trim().length > 0) {
      setShowDropdown(true);
      
      if (options.length === 0 && !loading) {
        setIsSearching(true);
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
          setIsSearching(false);
        }, 1000);
      }
    } else {
      setShowDropdown(false);
      setIsSearching(false);
      if (value) {
        onChange({ value: "", label: "" });
      }
    }
    
    setTimeout(() => {
      isTypingRef.current = false;
    }, 100);
  }, [disabled, value, onChange, options.length, loading]);

  const handleSelectOption = useCallback((option) => {
    if (disabled) return;
    setQuery(option.label);
    onChange(option);
    setShowDropdown(false);
    setActiveIndex(-1);
    setIsSearching(false);
    inputRef.current?.blur();
  }, [disabled, onChange]);

  const handleKeyDown = useCallback((e) => {
    if (!showDropdown || filteredOptions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filteredOptions[activeIndex]) {
          handleSelectOption(filteredOptions[activeIndex]);
        }
        break;
      
      case "Escape":
        setShowDropdown(false);
        setActiveIndex(-1);
        setIsSearching(false);
        break;
    }
  }, [showDropdown, filteredOptions, activeIndex, handleSelectOption]);

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center px-3 py-2 gap-2">
      <svg 
        className="animate-spin h-4 w-4 text-blue-600" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-sm text-gray-600">{loadingMessage}</span>
    </div>
  );

  if (disabled) {
    return (
      <div className="relative w-full">
        <Input
          ref={inputRef}
          value={query}
          placeholder={placeholder}
          readOnly
          className="cursor-not-allowed"
        />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        ref={inputRef}
        value={query}
        placeholder={placeholder}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (query.trim()) {
            setShowDropdown(true);
          }
        }}
        autoComplete="off"
        spellCheck={false}
      />

      {showDropdown && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto shadow-lg">

          {isLoading && (
            <LoadingSpinner />
          )}
          
          {!isLoading && filteredOptions.length === 0 && query.trim() && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No results found for "{query}"
            </div>
          )}
          
          {!isLoading && filteredOptions.length > 0 && (
            <>
              {filteredOptions.map((opt, index) => (
                <div
                  key={opt.value}
                  className={`px-3 py-2 cursor-pointer transition-colors duration-150 ${
                    index === activeIndex
                      ? "bg-accent text-black"
                      : "hover:bg-blue-100"
                  }`}
                  onClick={() => handleSelectOption(opt)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {opt.label}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
// import { useState, useRef, useEffect } from "react";
// import { Input } from "@/components/ui/input";

// export default function AsyncSearchableSelect({
//   options = [],
//   value,
//   onChange,

//   onSearch,

//   placeholder = "Search...",
//   disabled = false,

//   isLoading = false,

//   loadingMessage = "Searching...",
//   noOptionsMessage = "No results found",

//   debounceTime = 300,
// }) {
//   const [query, setQuery] = useState("");

//   const [showDropdown, setShowDropdown] =
//     useState(false);

//   const [activeIndex, setActiveIndex] =
//     useState(-1);

//   const wrapperRef = useRef(null);

//   const debounceRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         wrapperRef.current &&
//         !wrapperRef.current.contains(
//           event.target
//         )
//       ) {
//         setShowDropdown(false);
//       }
//     };

//     document.addEventListener(
//       "mousedown",
//       handleClickOutside
//     );

//     return () => {
//       document.removeEventListener(
//         "mousedown",
//         handleClickOutside
//       );
//     };
//   }, []);

//   useEffect(() => {
//     if (!value || !options.length) return;

//     const selected = options.find(
//       (opt) => opt.value === value
//     );

//     if (selected) {
//       setQuery(selected.label);
//     }
//   }, [value, options]);

//   const handleInputChange = (e) => {
//     if (disabled) return;

//     const val = e.target.value;

//     console.log(
//       "AsyncSearchableSelect Input =>",
//       val
//     );

//     setQuery(val);

//     setShowDropdown(true);

//     setActiveIndex(-1);

//     if (debounceRef.current) {
//       clearTimeout(debounceRef.current);
//     }

//     debounceRef.current = setTimeout(() => {
//       console.log(
//         "Debounced Search Triggered =>",
//         val
//       );

//       if (onSearch && val.trim()) {
//         onSearch(val);
//       }
//     }, debounceTime);

//     if (!val.trim() && value) {
//       onChange({
//         value: "",
//         label: "",
//       });
//     }
//   };

//   const handleSelectOption = (option) => {
//     if (disabled) return;

//     console.log(
//       "Selected Option =>",
//       option
//     );

//     setQuery(option.label);

//     onChange(option);

//     setShowDropdown(false);
//   };

//   return (
//     <div
//       ref={wrapperRef}
//       className={`relative w-full ${
//         disabled
//           ? "opacity-50 pointer-events-none cursor-not-allowed"
//           : ""
//       }`}
//     >
//       <Input
//         value={query}
//         placeholder={placeholder}
//         onChange={handleInputChange}
//         disabled={disabled}
//         autoComplete="off"
//         onFocus={() => {
//           if (
//             query.trim() ||
//             options.length > 0
//           ) {
//             setShowDropdown(true);
//           }
//         }}
//         onKeyDown={(e) => {
//           if (!showDropdown) return;

//           if (e.key === "ArrowDown") {
//             e.preventDefault();

//             setActiveIndex((prev) =>
//               prev < options.length - 1
//                 ? prev + 1
//                 : 0
//             );
//           }

//           if (e.key === "ArrowUp") {
//             e.preventDefault();

//             setActiveIndex((prev) =>
//               prev > 0
//                 ? prev - 1
//                 : options.length - 1
//             );
//           }

//           if (e.key === "Enter") {
//             e.preventDefault();

//             if (activeIndex >= 0) {
//               handleSelectOption(
//                 options[activeIndex]
//               );
//             }
//           }

//           if (e.key === "Escape") {
//             setShowDropdown(false);
//           }
//         }}
//       />

//       {showDropdown && (
//         <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-auto shadow-lg">
//           {isLoading ? (
//             <div className="px-3 py-2 text-sm text-gray-500 animate-pulse">
//               {loadingMessage}
//             </div>
//           ) : options.length > 0 ? (
//             options.map((opt, index) => (
//               <div
//                 key={opt.value}
//                 className={`px-3 py-2 cursor-pointer ${
//                   index === activeIndex
//                     ? "bg-accent text-black"
//                     : "hover:bg-blue-100"
//                 }`}
//                 onClick={() =>
//                   handleSelectOption(opt)
//                 }
//               >
//                 {opt.label}
//               </div>
//             ))
//           ) : (
//             <div className="px-3 py-2 text-sm text-gray-500">
//               {noOptionsMessage}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

export default function AsyncSearchableSelect({
  options = [],
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  disabled = false,
  isLoading = false,
  loadingMessage = "Searching...",
  noOptionsMessage = "No results found",
  debounceTime = 300,
}) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);

  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    if (!value || !options.length) return;

    const selected = options.find(
      (opt) => String(opt.value) === String(value)
    );

    if (selected) {
      setQuery(selected.label);
    }
  }, [value, options]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleInputChange = (e) => {
    if (disabled) return;

    const val = e.target.value;

    setQuery(val);
    setShowDropdown(true);
    setActiveIndex(-1);

    // Reset search state while typing
    setHasSearched(false);

    // Clear selected value if user edits input
    if (value) {
      onChange?.({
        value: "",
        label: "",
      });
    }

    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Abort previous request immediately
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // If input is empty, stop here
    if (!val.trim()) {
      return;
    }

    // Start debounced search
    debounceRef.current = setTimeout(async () => {
      if (!onSearch) return;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await onSearch(val.trim(), controller.signal);
      } catch (error) {
        if (
          error.name !== "AbortError" &&
          error.code !== "ERR_CANCELED"
        ) {
          console.error("Search error:", error);
        }
      } finally {
        setHasSearched(true);

        // Clear controller if it is the active one
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    }, debounceTime);
  };

  const handleSelectOption = (option) => {
    if (disabled) return;

    setQuery(option.label);
    onChange?.(option);
    setShowDropdown(false);
    setHasSearched(false);
  };

  const handleFocus = () => {
    if (disabled) return;

    if (query.trim() || options.length > 0 || isLoading) {
      setShowDropdown(true);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < options.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : options.length - 1
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (
        activeIndex >= 0 &&
        activeIndex < options.length
      ) {
        handleSelectOption(options[activeIndex]);
      }
    }

    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full ${disabled
          ? "opacity-50 pointer-events-none cursor-not-allowed"
          : ""
        }`}
    >
      <Input
        value={query}
        placeholder={placeholder}
        onChange={handleInputChange}
        disabled={disabled}
        autoComplete="off"
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
      />

      {showDropdown && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-auto shadow-lg">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500 animate-pulse">
              {loadingMessage}
            </div>
          ) : options.length > 0 ? (
            options.map((opt, index) => (
              <div
                key={opt.value}
                className={`px-3 py-2 cursor-pointer ${index === activeIndex
                    ? "bg-accent text-black"
                    : "hover:bg-blue-100"
                  }`}
                onClick={() =>
                  handleSelectOption(opt)
                }
              >
                {opt.label}
              </div>
            ))
          ) : hasSearched ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {noOptionsMessage}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

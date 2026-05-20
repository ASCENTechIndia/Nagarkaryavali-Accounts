import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MultiSelect = ({
    options = [],
    value = [],
    onChange,
    placeholder = "Search...",
    disabled = false,
}) => {
    const [query, setQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    const selectedOptions = options.filter((o) => value.includes(o.value));

    const filteredOptions = useMemo(() => {
        if (!query.trim()) return [];

        return options.filter((opt) =>
            opt.label.toLowerCase().includes(query.toLowerCase())
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

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleOption = (optionValue) => {
        if (value.includes(optionValue)) {
            onChange(value.filter((v) => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }

        setQuery("");
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
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

                if (activeIndex >= 0) {
                    toggleOption(filteredOptions[activeIndex].value);
                }

                break;

            default:
                break;
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div
                className={cn(
                    "h-9 w-full rounded-md border border-input bg-background px-2 flex items-center gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                    disabled && "opacity-50 cursor-not-allowed",
                )}
                onClick={() => {
                    if (!disabled) {
                        setShowDropdown(true);
                        inputRef.current?.focus();
                    }
                }}
            >
                <div className="flex items-center gap-1">
                    {selectedOptions.map((option) => (
                        <div
                            key={option.value}
                            className="text-sm rounded px-2 py-1 flex items-center gap-1"
                        >
                            {option.label}

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();

                                    toggleOption(option.value);
                                }}
                                className="text-xs"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                <Input
                    ref={inputRef}
                    value={query}
                    disabled={disabled}
                    onChange={(e) => {
                        const val = e.target.value;

                        setQuery(val);

                        if (val.trim()) {
                            setShowDropdown(true);
                        } else {
                            setShowDropdown(false);
                        }
                    }}
                    onFocus={() => {
                        if (query.trim()) {
                            setShowDropdown(true);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedOptions.length === 0 ? placeholder : ""}
                    className="border-0 shadow-none focus-visible:ring-0 h-7 min-w-[120px] flex-1 p-0 shrink-0"
                />
            </div>

            {showDropdown && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-md max-h-60 overflow-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm">
                            No results found
                        </div>
                    ) : (
                        filteredOptions.map((option, index) => {
                            const selected = value.includes(option.value);

                            return (
                                <div
                                    key={option.value}
                                    onClick={() => toggleOption(option.value)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={cn(
                                        "px-3 py-2 cursor-pointer flex items-center justify-between",
                                        index === activeIndex ? "bg-accent" : "hover:bg-muted",
                                    )}
                                >
                                    <span>{option.label}</span>

                                    {selected && <Check className="h-4 w-4" />}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;

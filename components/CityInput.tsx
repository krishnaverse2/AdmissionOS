"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import citiesData from "@/lib/data/cities.json";

interface City {
  id: string;
  name: string;
}

interface Props {
  /** Current value: a city id, or "any" for no filter. */
  value: string;
  onChange: (cityId: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * A free-type city input. The person can type any text:
 * - Typing a real city name (or part of one) shows a dropdown of matches.
 * - Picking a suggestion (or typing an exact match) filters to that city.
 * - Typing "any", leaving it blank, or typing something that matches no
 *   city all resolve to "any" — i.e. show colleges from every city. This
 *   means an unrecognized or empty city never silently returns zero
 *   results; it just stops filtering by city.
 */
export default function CityInput({
  value,
  onChange,
  placeholder = "Type a city, or leave blank for any city",
  className = "input",
}: Props) {
  const cities = citiesData as City[];
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const initialText = useMemo(() => {
    if (value === "any" || !value) return "";
    return cities.find((c) => c.id === value)?.name ?? "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [text, setText] = useState(initialText);
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [text, cities]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        resolveOnBlur();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function resolveOnBlur() {
    const q = text.trim().toLowerCase();
    if (!q || q === "any") {
      onChange("any");
      setText("");
      return;
    }
    const exact = cities.find((c) => c.name.toLowerCase() === q);
    if (exact) {
      onChange(exact.id);
      setText(exact.name);
      return;
    }
    const partial = cities.find((c) => c.name.toLowerCase().includes(q));
    if (partial) {
      onChange(partial.id);
      setText(partial.name);
      return;
    }
    // No match at all (e.g. "any city in maharashtra", typo, etc.) —
    // fall back to "any" rather than silently filtering to zero results.
    onChange("any");
  }

  function selectCity(city: City) {
    onChange(city.id);
    setText(city.name);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            resolveOnBlur();
            setOpen(false);
          }
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      {open && matches.length > 0 && (
        <ul
          id={listId}
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-line bg-white shadow-lg"
        >
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange("any");
                setText("");
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-ink/60 hover:bg-paper-dim"
            >
              Any city
            </button>
          </li>
          {matches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCity(c)}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-paper-dim"
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

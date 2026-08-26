"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A real ARIA listbox, not a styled <select>.
 *
 * Supports Up/Down, Home/End, type-ahead, Enter and Space to choose, Escape to
 * dismiss, and always hands focus back to the trigger when it closes. Focus
 * stays on the list itself and the active option is announced through
 * aria-activedescendant, which is what screen readers expect from this pattern.
 */
export type ListboxOption = {
  value: string;
  label: string;
  /** Optional second line, e.g. duration or capacity. */
  hint?: string;
  disabled?: boolean;
};

export function Listbox({
  label,
  options,
  value,
  onChange,
  placeholder = "Pilih",
  hint,
  error,
  name,
  required,
  disabled,
  className,
}: {
  label: string;
  options: ListboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const baseId = useId();
  const listId = baseId + "-list";
  const labelId = baseId + "-label";
  const hintId = baseId + "-hint";
  const errorId = baseId + "-error";

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ query: "", timer: 0 });

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const firstEnabled = useCallback(
    (from: number, direction: 1 | -1) => {
      const total = options.length;
      for (let step = 0; step < total; step += 1) {
        const index = (((from + direction * step) % total) + total) % total;
        if (!options[index].disabled) return index;
      }
      return from;
    },
    [options],
  );

  const openList = useCallback(() => {
    if (disabled) return;
    const start = selectedIndex >= 0 ? selectedIndex : firstEnabled(0, 1);
    setActiveIndex(start);
    setOpen(true);
  }, [disabled, firstEnabled, selectedIndex]);

  const closeList = useCallback(
    (returnFocus = true) => {
      setOpen(false);
      if (returnFocus) trigger.current?.focus();
    },
    [],
  );

  const commit = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      onChange(option.value);
      closeList();
    },
    [closeList, onChange, options],
  );

  /* Focus the list when it opens. */
  useEffect(() => {
    if (open) list.current?.focus();
  }, [open]);

  /* Keep the active option scrolled into view. */
  useEffect(() => {
    if (!open) return;
    const node = document.getElementById(baseId + "-option-" + activeIndex);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, baseId, open]);

  /* A click anywhere else closes it, without stealing focus back. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const runTypeahead = useCallback(
    (character: string) => {
      window.clearTimeout(typeahead.current.timer);
      typeahead.current.query += character.toLowerCase();
      typeahead.current.timer = window.setTimeout(() => {
        typeahead.current.query = "";
      }, 600);

      const query = typeahead.current.query;
      const start = activeIndex + (query.length === 1 ? 1 : 0);
      for (let step = 0; step < options.length; step += 1) {
        const index = (start + step) % options.length;
        const option = options[index];
        if (!option.disabled && option.label.toLowerCase().startsWith(query)) {
          setActiveIndex(index);
          return;
        }
      }
    },
    [activeIndex, options],
  );

  const onListKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => firstEnabled(index + 1, 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => firstEnabled(index - 1, -1));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(firstEnabled(0, 1));
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(firstEnabled(options.length - 1, -1));
        break;
      case "Enter":
      case " ":
      case "Spacebar":
        event.preventDefault();
        commit(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        closeList();
        break;
      case "Tab":
        closeList(false);
        break;
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          event.preventDefault();
          runTypeahead(event.key);
        }
    }
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " ", "Spacebar"].includes(event.key)) {
      event.preventDefault();
      openList();
    }
  };

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("relative", className)} ref={wrapper}>
      <span className="field-label" id={labelId}>
        {label}
        {required && (
          <span className="ml-1 text-accent" aria-hidden="true">
            *
          </span>
        )}
      </span>

      {name && <input type="hidden" name={name} value={value} />}

      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        aria-required={required}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "input flex w-full items-center justify-between gap-3 text-left",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className={cn("truncate", !selected && "text-ink-2")}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          viewBox="0 0 16 16"
          width="15"
          height="15"
          aria-hidden="true"
          fill="none"
          className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")}
        >
          <path
            d="M4 6.5L8 10.5L12 6.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={baseId + "-option-" + activeIndex}
          onKeyDown={onListKeyDown}
          className="layer-popover absolute left-0 right-0 top-[calc(100%+0.375rem)] max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-line bg-paper p-1.5 shadow-[0_18px_44px_-24px_rgba(27,21,15,0.5)] focus:outline-none"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                id={baseId + "-option-" + index}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                onClick={() => commit(index)}
                onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                className={cn(
                  "flex cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem]",
                  isActive && "bg-paper-3",
                  option.disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.hint && (
                    <span className="mt-0.5 block text-[0.8125rem] text-ink-2">
                      {option.hint}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <svg
                    viewBox="0 0 16 16"
                    width="15"
                    height="15"
                    aria-hidden="true"
                    fill="none"
                    className="mt-1 shrink-0 text-accent"
                  >
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hint && !error && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

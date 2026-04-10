import { useEffect, useRef, useState } from "react";

type CustomSelectProps = {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

export function CustomSelect({ value, options, onChange }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div className={open ? "custom-select is-open" : "custom-select"} ref={rootRef}>
      <button
        aria-expanded={open}
        className="custom-select__trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{selectedOption.label}</span>
        <span className="custom-select__chevron" />
      </button>

      {open ? (
        <div className="custom-select__menu" role="listbox">
          {options.map((option) => (
            <button
              className={
                option.value === value
                  ? "custom-select__option is-selected"
                  : "custom-select__option"
              }
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

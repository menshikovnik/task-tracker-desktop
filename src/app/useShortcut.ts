import { useEffect, useRef } from "react";
import { isModifierPressed } from "./platform";

type ShortcutOptions = {
  key: string;
  mod?: boolean;
  preventDefault?: boolean;
  enabled?: boolean;
  allowInEditable?: boolean;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function keyMatches(event: KeyboardEvent, key: string) {
  return event.key.toLowerCase() === key.toLowerCase();
}

export function useShortcut(options: ShortcutOptions, handler: (event: KeyboardEvent) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (options.enabled === false) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!options.allowInEditable && isEditableTarget(event.target)) {
        return;
      }

      if (options.mod && !isModifierPressed(event)) {
        return;
      }

      if (!options.mod && (event.metaKey || event.ctrlKey || event.altKey)) {
        return;
      }

      if (!keyMatches(event, options.key)) {
        return;
      }

      if (options.preventDefault !== false) {
        event.preventDefault();
      }

      handlerRef.current(event);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options.allowInEditable, options.enabled, options.key, options.mod, options.preventDefault]);
}

export function getPlatform() {
  if (typeof navigator === "undefined") {
    return "other";
  }

  const platform = navigator.platform.toLowerCase();
  if (platform.includes("mac") || platform.includes("iphone") || platform.includes("ipad") || platform.includes("ipod")) {
    return "mac";
  }

  if (platform.includes("win")) {
    return "windows";
  }

  return "other";
}

export function isMacPlatform() {
  return getPlatform() === "mac";
}

export function isModifierPressed(event: KeyboardEvent | ReactKeyboardEvent) {
  return isMacPlatform() ? event.metaKey : event.ctrlKey;
}

export function getModifierKeyLabel() {
  return isMacPlatform() ? "⌘" : "Ctrl";
}

export function formatShortcut(keys: string[]) {
  return keys.join(" ");
}
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

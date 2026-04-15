/**
 * <Kbd> – a styled keyboard shortcut badge.
 *
 * Very muted by design: meant to hint at a shortcut without
 * competing with the surrounding UI. Hidden on touch-only
 * (coarse pointer) devices where physical keys aren't present.
 */
export function Kbd({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={[
        // Hidden on coarse-pointer (touch) devices
        "hidden [@media(pointer:fine)]:inline-flex",
        "items-center justify-center",
        "rounded-[3px] border border-white/[0.09] bg-white/[0.05]",
        "px-1 py-px",
        "font-mono text-[9.5px] leading-none font-normal tracking-wide text-white/25",
        "select-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </kbd>
  );
}

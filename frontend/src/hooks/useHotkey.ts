import { useEffect } from "react";

export function useHotkey(
  key: string,
  callback: () => void,
  deps: unknown[] = []
) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key.toLowerCase() === key.toLowerCase() && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        callback();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...deps]);
}

import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = `UMAM - ${title}`;
  }, [title]);
}

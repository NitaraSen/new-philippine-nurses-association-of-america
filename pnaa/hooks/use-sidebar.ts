"use client";

import { useState, useEffect, useCallback } from "react";

const SIDEBAR_KEY = "pnaa-sidebar-collapsed";

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }
  }, []);

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  }, []);

  return { isCollapsed, toggle };
}

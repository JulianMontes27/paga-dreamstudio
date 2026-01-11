"use client";

import { useEffect } from "react";

export function LandingThemeCleanup() {
  useEffect(() => {
    // Force remove any theme classes that might interfere with landing page
    const html = document.documentElement;
    const body = document.body;

    html.classList.remove('dark', 'light');
    body.classList.remove('dark', 'light');

    // Also clear any theme-related attributes
    html.removeAttribute('data-theme');
    body.removeAttribute('data-theme');
  }, []);

  return null; // This component renders nothing
}
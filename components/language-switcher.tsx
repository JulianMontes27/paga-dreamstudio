"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();

  function onSelectChange(newLocale: string) {
    startTransition(async () => {
      // Set cookie and reload
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
      window.location.reload();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onSelectChange("es")}
          className={locale === "es" ? "bg-accent" : ""}
        >
          🇪🇸 Español
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSelectChange("en")}
          className={locale === "en" ? "bg-accent" : ""}
        >
          🇬🇧 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

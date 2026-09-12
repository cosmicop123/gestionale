"use client";

import { useState } from "react";
import { Menu, Search, LogOut, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarContenuto } from "./sidebar-contenuto";

export function BarraSuperiore() {
  const [menuMobileAperto, setMenuMobileAperto] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background px-4">
      <Sheet open={menuMobileAperto} onOpenChange={setMenuMobileAperto}>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMenuMobileAperto(true)}
          aria-label="Apri il menu di navigazione"
        >
          <Menu />
        </Button>
        <SheetContent side="left" className="w-72 p-4">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigazione</SheetTitle>
          </SheetHeader>
          <SidebarContenuto onNavigate={() => setMenuMobileAperto(false)} />
        </SheetContent>
      </Sheet>

      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {/* Ricerca globale (soci, corsi, documenti): richiamabile da tastiera — vedi §9. Attiva dalla milestone M2. */}
        <Input
          placeholder="Cerca soci, corsi, documenti..."
          disabled
          className="pl-9"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="size-8">
              <AvatarFallback>
                <UserRound className="size-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem disabled>Profilo utente (M1)</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <LogOut />
            Esci
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

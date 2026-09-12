import { SidebarContenuto } from "@/components/layout/sidebar-contenuto";
import { BarraSuperiore } from "@/components/layout/barra-superiore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full">
      <aside className="hidden w-64 shrink-0 border-r p-4 lg:block">
        <SidebarContenuto />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperiore />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

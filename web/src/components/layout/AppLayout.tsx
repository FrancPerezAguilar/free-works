import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { AssistantModal } from "@/components/assistant/AssistantModal";

export function AppLayout() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 pb-20 md:pb-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <AssistantModal />
    </div>
  );
}

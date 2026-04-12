import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        <Header />
        <main className="pt-20 px-8 pb-12 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

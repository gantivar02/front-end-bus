import { Outlet } from "react-router-dom";
import NegocioSidebar from "./NegocioSidebar";
import NegocioHeader from "./NegocioHeader";
import { MessageNotificationsProvider } from "../../../features/negocio/mensajeria/MessageNotificationsProvider";

export default function NegocioLayout() {
  return (
    <MessageNotificationsProvider>
      <div className="bg-neg-surface text-neg-on-surface min-h-screen font-body">
        <NegocioSidebar />
        <div className="ml-64 min-h-screen flex flex-col">
          <NegocioHeader />
          <main className="pt-20 px-8 pb-12 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </MessageNotificationsProvider>
  );
}

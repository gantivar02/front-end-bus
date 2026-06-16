import { createContext, useContext } from "react";

export const MessageNotificationsContext = createContext({
  unreadCount: 0,
  isMessagingEnabled: false,
  refreshUnreadCount: async () => 0,
  syncUnreadCount: () => {},
});

export function useMessageNotifications() {
  return useContext(MessageNotificationsContext);
}

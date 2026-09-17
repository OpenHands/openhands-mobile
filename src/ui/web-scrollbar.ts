import { Platform } from "react-native";

/** RN-web maps `dataSet` onto `data-*` attributes for the custom scrollbar CSS. */
export const webScrollbarProps =
  Platform.OS === "web" ? { dataSet: { ohScrollbar: "1" } } : {};

export const webSidebarProps =
  Platform.OS === "web" ? { dataSet: { ohSidebar: "1" } } : {};

export const webChatProps =
  Platform.OS === "web" ? { dataSet: { ohChat: "1" } } : {};

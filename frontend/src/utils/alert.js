import { Platform, Alert as RNAlert } from "react-native";

// react-native-web's Alert.alert() is a no-op (class Alert { static alert() {} }),
// so confirmation dialogs, logout prompts and error messages silently do nothing
// on web. This drop-in replacement implements the same (title, message, buttons)
// API using the browser's native dialogs on web, and delegates to the real
// React Native Alert on iOS/Android.
export function showAlert(title, message, buttons) {
  if (Platform.OS !== "web") {
    return RNAlert.alert(title, message, buttons);
  }

  const text = [title, message].filter(Boolean).join("\n\n");

  // No buttons, or a single OK button -> informational alert.
  if (!buttons || buttons.length <= 1) {
    if (typeof window !== "undefined" && window.alert) window.alert(text);
    const only = buttons && buttons[0];
    if (only && only.onPress) only.onPress();
    return;
  }

  // Two or more buttons -> treat as a confirm. The non-cancel button is the
  // confirm action; the "cancel" styled one is the dismiss action.
  const cancelBtn = buttons.find((b) => b && b.style === "cancel");
  const confirmBtn =
    buttons.find((b) => b && b.style !== "cancel") || buttons[buttons.length - 1];

  const confirmed =
    typeof window !== "undefined" && window.confirm ? window.confirm(text) : false;

  if (confirmed) {
    if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress();
  } else if (cancelBtn && cancelBtn.onPress) {
    cancelBtn.onPress();
  }
}

export default { alert: showAlert };

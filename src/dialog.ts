import { Alert, AlertButton, Platform } from 'react-native';

/**
 * Same call as React Native's Alert.alert. On phones it is exactly Alert.alert; in a browser,
 * where Alert.alert does nothing, it uses the browser's own confirm/alert box instead.
 */
export const Dialog = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS !== 'web') {
      Alert.alert(title, message, buttons);
      return;
    }
    const text = message ? `${title}\n\n${message}` : title;
    const cancel = buttons?.find((b) => b.style === 'cancel');
    const action = buttons?.find((b) => b.style !== 'cancel');
    if (!action) {
      window.alert(text);
      (cancel ?? buttons?.[0])?.onPress?.();
      return;
    }
    // OK runs the action (e.g. "Log out"), Cancel runs the cancel button
    if (window.confirm(`${text}\n\nOK: ${action.text ?? 'OK'}`)) action.onPress?.();
    else cancel?.onPress?.();
  },
};

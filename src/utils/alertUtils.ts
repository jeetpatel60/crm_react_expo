import { Alert } from 'react-native';

/**
 * Show a confirmation dialog with Yes/No options
 * @param title Dialog title
 * @param message Dialog message
 * @param onConfirm Callback function to execute when user confirms
 * @param onCancel Optional callback function to execute when user cancels
 */
export const confirmDelete = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'No',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
    { cancelable: false }
  );
};

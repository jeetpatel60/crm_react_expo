import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

// Define allowed file types
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];

// Maximum file size in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// File storage directory
export const FILE_STORAGE_DIR = `${FileSystem.documentDirectory}letterheads/`;

// Interface for file info
export interface FileInfo {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

// Create storage directory if it doesn't exist
export const ensureDirectoryExists = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(FILE_STORAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(FILE_STORAGE_DIR, { intermediates: true });
      console.log('Created letterheads directory');
    }
  } catch (error) {
    console.error('Error creating directory:', error);
    throw error;
  }
};

// Pick a document from device
export const pickDocument = async (): Promise<FileInfo | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_FILE_TYPES,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return null;
    }

    const file = result.assets[0];
    
    // Check file size
    if (file.size && file.size > MAX_FILE_SIZE) {
      Alert.alert('File Too Large', 'Please select a file smaller than 5MB');
      return null;
    }

    return {
      uri: file.uri,
      name: file.name || 'unknown_file',
      size: file.size || 0,
      mimeType: file.mimeType || 'application/octet-stream',
    };
  } catch (error) {
    console.error('Error picking document:', error);
    Alert.alert('Error', 'Failed to pick document. Please try again.');
    return null;
  }
};

// Save file to app's document directory
export const saveFile = async (fileInfo: FileInfo): Promise<string> => {
  try {
    await ensureDirectoryExists();

    // Generate a unique filename
    const timestamp = Date.now();
    const fileExtension = fileInfo.name.split('.').pop() || '';
    const fileName = `letterhead_${timestamp}.${fileExtension}`;
    const destinationUri = `${FILE_STORAGE_DIR}${fileName}`;

    // Copy the file
    await FileSystem.copyAsync({
      from: fileInfo.uri,
      to: destinationUri,
    });

    console.log(`File saved to ${destinationUri}`);
    return destinationUri;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

// Delete a file
export const deleteFile = async (fileUri: string): Promise<void> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri);
      console.log(`File deleted: ${fileUri}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

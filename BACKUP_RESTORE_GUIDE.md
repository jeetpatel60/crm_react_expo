# Backup & Restore Guide

## Overview
Your CRM app includes a comprehensive backup and restore system to protect your valuable data. This guide explains both automatic and manual backup/restore scenarios.

## 🔄 Automatic Backup System

### How it Works
- **Frequency**: 5 times daily at scheduled times (6 AM, 10 AM, 2 PM, 6 PM, 10 PM)
- **Storage**: Backups are stored locally on your device
- **Retention**: Only the latest 5 backups are kept (older ones are automatically deleted)
- **Location**: Internal app storage (secure and private)

### Enabling Automatic Backups
1. Open the app and go to **Settings** → **Backup Management**
2. Toggle **Auto Backup** to ON
3. The system will automatically create backups at scheduled times

## 📱 Use Case 1: Phone Reset / New Device Installation

### Scenario
You've reset your phone or installed the app on a new device and want to restore all your data from a previously exported backup.

### Steps to Restore
1. **Before Reset**: Export your backup
   - Go to **Settings** → **Backup Management**
   - Tap **Export Latest Backup**
   - Save the `.db` file to a safe location (cloud storage, email, etc.)

2. **After Reset/New Installation**:
   - Install the CRM app
   - Go to **Settings** → **Backup Management**
   - Tap **Import & Restore from File**
   - Select your saved `.db` backup file
   - Confirm the restoration
   - Wait for the process to complete
   - Your data will be fully restored!

### What Happens During Import & Restore
- ✅ Creates a safety backup of current data (if any)
- ✅ Validates the selected backup file
- ✅ Replaces the main database (crm.db) with your backup
- ✅ Refreshes all app screens to show restored data
- ✅ Shows confirmation with data counts

## 🕐 Use Case 2: Restore from Automatic Backup

### Scenario
You want to restore data from one of the automatic backups created by the system (e.g., to recover accidentally deleted data).

### Steps to Restore
1. Go to **Settings** → **Backup Management**
2. Scroll down to **Available Backups** section
3. Find the backup you want to restore from
4. Tap **Restore** on that backup
5. Confirm the restoration in the dialog
6. Wait for the process to complete
7. Your data will be restored to that backup point!

### What Happens During Automatic Backup Restore
- ✅ Creates a safety backup of current data
- ✅ Validates the selected backup
- ✅ Replaces the main database (crm.db) with the backup
- ✅ Refreshes all app screens to show restored data
- ✅ Shows confirmation with data counts

## 🔧 Technical Details

### Database File
- **Main Database**: `crm.db` (this is where all your live data is stored)
- **Location**: App's private storage directory
- **Format**: SQLite database file

### Backup Files
- **Format**: `.db` files (SQLite database copies)
- **Naming**: `crm_backup_[timestamp]_[date].db`
- **Content**: Complete copy of your database at backup time

### Safety Features
- **Pre-restore Backup**: Before any restore operation, a safety backup of your current data is automatically created
- **Validation**: All backup files are validated before restoration
- **Progress Tracking**: Real-time progress updates during restore operations
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 💡 Best Practices

### For Maximum Data Safety
1. **Enable Auto Backup**: Always keep automatic backups enabled
2. **Regular Exports**: Export backups monthly and store them safely
3. **Test Restores**: Occasionally test the restore process to ensure backups work
4. **Multiple Locations**: Store exported backups in multiple locations (cloud, email, USB)

### Before Major Operations
- Export a manual backup before:
  - Major data imports
  - App updates
  - Device changes
  - Bulk data modifications

## 🚨 Important Notes

### Data Replacement
- **Complete Replacement**: Restore operations replace ALL current data
- **No Merging**: Data is not merged - it's completely replaced
- **Safety Backup**: Your current data is always backed up before restoration

### File Compatibility
- Only `.db` files from this CRM app can be restored
- Backup files are validated for integrity before restoration
- Cross-device compatibility is fully supported

### Performance
- Restore operations may take a few moments depending on data size
- The app will refresh automatically after successful restoration
- All screens will show the restored data immediately

## 🔍 Troubleshooting

### If Restore Fails
1. Check that the backup file is not corrupted
2. Ensure sufficient storage space on device
3. Try restarting the app and attempting again
4. Contact support if issues persist

### If Data Doesn't Appear
1. Navigate to different screens to trigger refresh
2. Check the success message for data counts
3. Restart the app if necessary
4. Use "Test Database Connection" to verify

### Backup File Issues
- Ensure the file has a `.db` extension
- Verify the file is not empty or corrupted
- Check that it's actually a backup from this CRM app

## 📞 Support
If you encounter any issues with backup or restore operations, the app includes diagnostic tools:
- **Test Database Connection**: Verifies database integrity and shows data counts
- **Detailed Error Messages**: Clear explanations of any issues
- **Progress Tracking**: Real-time updates during operations

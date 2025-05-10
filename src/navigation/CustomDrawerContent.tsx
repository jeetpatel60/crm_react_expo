import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Divider, Text, useTheme, Avatar } from 'react-native-paper';
import { APP_NAME } from '../constants';

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const theme = useTheme();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1 }}
      style={{ backgroundColor: theme.colors.surface }}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.userInfo}>
          <Avatar.Text
            size={60}
            label="CRM"
            style={{ backgroundColor: theme.colors.primaryContainer }}
            color={theme.colors.onPrimaryContainer}
          />
          <View style={styles.userDetails}>
            <Text style={[styles.appName, { color: '#fff' }]}>{APP_NAME}</Text>
            <Text style={[styles.version, { color: 'rgba(255, 255, 255, 0.8)' }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.drawerContent}>
        <DrawerItemList {...props} />
      </View>
      <Divider style={styles.divider} />
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
          © 2025 CRM App
        </Text>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingTop: 40,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 15,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  version: {
    fontSize: 14,
    marginTop: 4,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 10,
  },
  divider: {
    marginVertical: 10,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});

export default CustomDrawerContent;

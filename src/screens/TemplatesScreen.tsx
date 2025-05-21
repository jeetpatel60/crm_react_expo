import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, TabBar, SceneMap, TabBarProps } from 'react-native-tab-view';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';

interface Route {
  key: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

import AgreementTemplatesScreen from './AgreementTemplatesScreen';
import PaymentRequestTemplatesScreen from './PaymentRequestTemplatesScreen';
import PaymentReceiptTemplatesScreen from './PaymentReceiptTemplatesScreen';
import { spacing, borderRadius } from '../constants/theme';

const TemplatesScreen: React.FC = () => {
  const layout = useWindowDimensions();
  const theme = useTheme();

  const [index, setIndex] = useState(0);
  const [routes] = useState<Route[]>([
    { key: 'agreement', title: 'Agreement', icon: 'file-document-outline' },
    { key: 'paymentRequest', title: 'Payment Request', icon: 'cash-multiple' },
    { key: 'paymentReceipt', title: 'Payment Receipt', icon: 'receipt' },
  ]);

  const renderScene = SceneMap({
    agreement: AgreementTemplatesScreen,
    paymentRequest: PaymentRequestTemplatesScreen,
    paymentReceipt: PaymentReceiptTemplatesScreen,
  });

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: theme.colors.primary }}
      style={{ backgroundColor: theme.colors.surface }}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      labelStyle={{ textTransform: 'none', fontWeight: '500' }}
      renderIcon={({ route, focused, color }: { route: Route; focused: boolean; color: string }) => (
        <MaterialCommunityIcons
          name={route.icon}
          size={20}
          color={color}
        />
      )}
    />
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={renderTabBar}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TemplatesScreen;

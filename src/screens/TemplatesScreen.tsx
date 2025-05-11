import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';

import AgreementTemplatesScreen from './AgreementTemplatesScreen';
import PaymentRequestTemplatesScreen from './PaymentRequestTemplatesScreen';
import { spacing, borderRadius } from '../constants/theme';

const TemplatesScreen: React.FC = () => {
  const layout = useWindowDimensions();
  const theme = useTheme();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'agreement', title: 'Agreement', icon: 'file-document-outline' },
    { key: 'payment', title: 'Payment Request', icon: 'cash-multiple' },
  ]);

  const renderScene = SceneMap({
    agreement: AgreementTemplatesScreen,
    payment: PaymentRequestTemplatesScreen,
  });

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: theme.colors.primary }}
      style={{ backgroundColor: theme.colors.surface }}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      labelStyle={{ textTransform: 'none', fontWeight: '500' }}
      renderIcon={({ route, focused, color }) => (
        <MaterialCommunityIcons
          name={route.icon as any}
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
      pagerStyle={{ flex: 1 }}
      renderPager={(props) => <PagerView {...props} />}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TemplatesScreen;

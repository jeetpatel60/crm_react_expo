import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList, DrawerParamList } from '../types';

type QuotationScreenNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList, 'Quotation'>,
  StackNavigationProp<RootStackParamList>
>;

const QuotationScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<QuotationScreenNavigationProp>();

  return (
    <ScrollView style={styles.container}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Content>
          <Text variant="titleLarge" style={{ marginBottom: 10 }}>Quotation</Text>
          <Text variant="bodyMedium">
            This is a placeholder for the Quotation screen. Content will be implemented in a future update.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});

export default QuotationScreen;

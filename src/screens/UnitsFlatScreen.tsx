import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';

const UnitsFlatScreen = () => {
  const theme = useTheme();

  return (
    <ScrollView style={styles.container}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Content>
          <Text variant="titleLarge" style={{ marginBottom: 10 }}>Units/Flats</Text>
          <Text variant="bodyMedium">
            This is a placeholder for the Units/Flats screen. Content will be implemented in a future update.
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

export default UnitsFlatScreen;

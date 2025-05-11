import React from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Milestone } from '../database/projectSchedulesDb';

type TestNavigationProp = StackNavigationProp<RootStackParamList>;

const TestMilestoneEditScreen = () => {
  const navigation = useNavigation<TestNavigationProp>();

  // Create a test milestone
  const testMilestone: Milestone = {
    id: 999, // Test ID
    schedule_id: 1,
    sr_no: 1,
    milestone_name: 'Test Milestone',
    completion_percentage: 50,
    status: 'In Progress',
  };

  const handleNavigateToEdit = () => {
    console.log('Navigating to EditMilestone with test milestone:', testMilestone);
    navigation.navigate('EditMilestone', { milestone: testMilestone });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Milestone Edit Navigation</Text>
      <Text style={styles.description}>
        This screen tests navigation to the EditMilestoneScreen.
      </Text>
      <Button title="Navigate to Edit Milestone" onPress={handleNavigateToEdit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    marginBottom: 30,
  },
});

export default TestMilestoneEditScreen;

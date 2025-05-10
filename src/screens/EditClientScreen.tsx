import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { Client } from '../types';
import { updateClient } from '../database';
import { spacing } from '../constants/theme';

type EditClientRouteProp = RouteProp<RootStackParamList, 'EditClient'>;
type EditClientNavigationProp = StackNavigationProp<RootStackParamList>;

const EditClientScreen = () => {
  const theme = useTheme();
  const route = useRoute<EditClientRouteProp>();
  const navigation = useNavigation<EditClientNavigationProp>();
  const { client } = route.params;

  const [name, setName] = useState(client.name);
  const [address, setAddress] = useState(client.address || '');
  const [panNo, setPanNo] = useState(client.pan_no || '');
  const [gstinNo, setGstinNo] = useState(client.gstin_no || '');
  const [contactNo, setContactNo] = useState(client.contact_no || '');
  const [email, setEmail] = useState(client.email || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Client name is required';
    }

    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const updatedClient: Client = {
        id: client.id,
        name,
        address: address || undefined,
        pan_no: panNo || undefined,
        gstin_no: gstinNo || undefined,
        contact_no: contactNo || undefined,
        email: email || undefined,
      };

      await updateClient(updatedClient);

      Alert.alert('Success', 'Client updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating client:', error);
      Alert.alert('Error', 'Failed to update client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          label="Client Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          error={!!errors.name}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.name && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.name}
          </Text>
        )}

        <TextInput
          label="Address"
          value={address}
          onChangeText={setAddress}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={4}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <TextInput
          label="PAN Number"
          value={panNo}
          onChangeText={setPanNo}
          mode="outlined"
          style={styles.input}
          autoCapitalize="characters"
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <TextInput
          label="GSTIN Number"
          value={gstinNo}
          onChangeText={setGstinNo}
          mode="outlined"
          style={styles.input}
          autoCapitalize="characters"
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <TextInput
          label="Contact Number"
          value={contactNo}
          onChangeText={setContactNo}
          mode="outlined"
          style={styles.input}
          keyboardType="phone-pad"
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          error={!!errors.email}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.email && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.email}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          Update Client
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  input: {
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  button: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});

export default EditClientScreen;

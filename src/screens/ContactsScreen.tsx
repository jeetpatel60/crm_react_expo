import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Searchbar, FAB, useTheme, Appbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { Contact } from '../types';
import { getContacts, deleteContact } from '../database';
import { ContactCard, LoadingIndicator, EmptyState } from '../components';
import { spacing } from '../constants/theme';

type ContactsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ContactsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<ContactsScreenNavigationProp>();
  
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await getContacts();
      setContacts(data);
      setFilteredContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [])
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(query.toLowerCase()) ||
          (contact.email && contact.email.toLowerCase().includes(query.toLowerCase())) ||
          (contact.company && contact.company.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredContacts(filtered);
    }
  };

  const handleDeleteContact = (contactId: number) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContact(contactId);
              loadContacts();
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'Failed to delete contact. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search contacts..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
        inputStyle={{ color: theme.colors.onSurface }}
      />

      {filteredContacts.length === 0 ? (
        <EmptyState
          icon="account-search"
          title="No Contacts Found"
          message={
            searchQuery
              ? "We couldn't find any contacts matching your search."
              : "You don't have any contacts yet. Add your first contact to get started."
          }
          buttonText={searchQuery ? undefined : "Add Contact"}
          onButtonPress={searchQuery ? undefined : () => navigation.navigate('AddContact')}
        />
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <ContactCard
              contact={item}
              onPress={(contact) => navigation.navigate('ContactDetails', { contactId: contact.id! })}
              onEdit={(contact) => navigation.navigate('EditContact', { contact })}
              onDelete={(contactId) => handleDeleteContact(contactId)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddContact')}
        color="#fff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: spacing.md,
    elevation: 2,
    borderRadius: 8,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ContactsScreen;

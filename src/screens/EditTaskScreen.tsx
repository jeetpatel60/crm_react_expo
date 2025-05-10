import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, useTheme, Text, SegmentedButtons, Menu, Divider } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// import DateTimePicker from '@react-native-community/datetimepicker';

import { RootStackParamList } from '../types';
import { Task, TaskStatus } from '../database/tasksDb';
import { Contact } from '../types';
import { updateTask, getContacts } from '../database';
import { spacing } from '../constants/theme';
import { TASK_STATUS_OPTIONS } from '../constants';

type EditTaskRouteProp = RouteProp<RootStackParamList, 'EditTask'>;
type EditTaskNavigationProp = StackNavigationProp<RootStackParamList>;

const EditTaskScreen = () => {
  const theme = useTheme();
  const route = useRoute<EditTaskRouteProp>();
  const navigation = useNavigation<EditTaskNavigationProp>();
  const { task } = route.params;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState<Date | null>(task.due_date ? new Date(task.due_date) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | undefined>(task.contact_id);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [selectedContactName, setSelectedContactName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const contactsData = await getContacts();
        setContacts(contactsData);

        if (task.contact_id) {
          const contact = contactsData.find(c => c.id === task.contact_id);
          if (contact) {
            setSelectedContactName(contact.name);
          }
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
      }
    };

    loadContacts();
  }, [task.contact_id]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
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

      const updatedTask: Task = {
        ...task,
        title,
        description: description || undefined,
        status,
        due_date: dueDate ? dueDate.getTime() : undefined,
        contact_id: selectedContactId,
      };

      await updateTask(updatedTask);

      Alert.alert('Success', 'Task updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // This function will be implemented when DateTimePicker is added
  const handleDateChange = () => {
    // Placeholder
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          label="Title *"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          error={!!errors.title}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />
        {errors.title && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.title}
          </Text>
        )}

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={4}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
        />

        <Text style={styles.sectionTitle}>Status</Text>
        <SegmentedButtons
          value={status}
          onValueChange={(value) => setStatus(value as TaskStatus)}
          buttons={TASK_STATUS_OPTIONS.map(option => ({
            value: option.value,
            label: option.label,
          }))}
          style={styles.segmentedButtons}
        />

        <Text style={styles.sectionTitle}>Due Date</Text>
        <Button
          mode="outlined"
          onPress={() => {
            // For now, just set a date manually
            setDueDate(new Date(Date.now() + 86400000)); // Tomorrow
          }}
          style={styles.dateButton}
          icon="calendar"
        >
          {dueDate ? formatDate(dueDate) : 'Select Due Date'}
        </Button>

        {/* DateTimePicker implementation will be added later */}

        <Text style={styles.sectionTitle}>Contact</Text>
        <View style={styles.contactContainer}>
          <Button
            mode="outlined"
            onPress={() => setShowContactMenu(true)}
            style={styles.contactButton}
            icon="account"
          >
            {selectedContactName || 'Select Contact'}
          </Button>

          <Menu
            visible={showContactMenu}
            onDismiss={() => setShowContactMenu(false)}
            anchor={<View />}
            style={styles.contactMenu}
          >
            <Menu.Item
              onPress={() => {
                setSelectedContactId(undefined);
                setSelectedContactName('');
                setShowContactMenu(false);
              }}
              title="None"
            />
            <Divider />
            {contacts.map((contact) => (
              <Menu.Item
                key={contact.id}
                onPress={() => {
                  setSelectedContactId(contact.id);
                  setSelectedContactName(contact.name);
                  setShowContactMenu(false);
                }}
                title={contact.name}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Update Task
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.button}
            disabled={loading}
          >
            Cancel
          </Button>
        </View>
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
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  segmentedButtons: {
    marginBottom: spacing.md,
  },
  dateButton: {
    marginBottom: spacing.md,
  },
  contactContainer: {
    position: 'relative',
  },
  contactButton: {
    marginBottom: spacing.md,
  },
  contactMenu: {
    width: '80%',
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  button: {
    marginBottom: spacing.md,
  },
});

export default EditTaskScreen;

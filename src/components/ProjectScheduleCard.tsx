import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton, useTheme, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { ProjectSchedule, Project } from '../types';
import { spacing, shadows, borderRadius, animations } from '../constants/theme';

interface ProjectScheduleCardProps {
  schedule: ProjectSchedule;
  project: Project;
  onPress: (schedule: ProjectSchedule) => void;
  onEdit: (schedule: ProjectSchedule) => void;
  onDelete: (scheduleId: number) => void;
  index: number;
}

const ProjectScheduleCard = ({
  schedule,
  project,
  onPress,
  onEdit,
  onDelete,
  index,
}: ProjectScheduleCardProps) => {
  const theme = useTheme();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(animations.duration.standard)}
    >
      <Card
        style={[
          styles.card,
          shadows.md,
          { backgroundColor: theme.colors.surface }
        ]}
        onPress={() => onPress(schedule)}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.mainContent}>
            <Text
              variant="titleMedium"
              style={[styles.projectName, { color: theme.colors.primary }]}
            >
              {project.name}
            </Text>
            <View style={styles.dateContainer}>
              <MaterialCommunityIcons
                name="calendar"
                size={16}
                color={theme.colors.onSurfaceVariant}
                style={styles.icon}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {formatDate(schedule.date)}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => onEdit(schedule)}
              iconColor={theme.colors.primary}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => {
                if (schedule.id) {
                  onDelete(schedule.id);
                }
              }}
              iconColor={theme.colors.error}
            />
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  projectName: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  icon: {
    marginRight: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
  },
});

export default ProjectScheduleCard;

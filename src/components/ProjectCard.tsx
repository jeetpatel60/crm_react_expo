import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card, Text, Avatar, useTheme, IconButton, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { Project } from '../types';
import { shadows, spacing, borderRadius } from '../constants/theme';
import { usePressAnimation, useStaggeredAnimation } from '../utils/animationUtils';
import { getCompanyById } from '../database/companiesDb';
import StatusBadge from './StatusBadge';

interface ProjectCardProps {
  project: Project;
  onPress: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: number) => void;
  index?: number; // For staggered animations
}

const ProjectCard = ({ project, onPress, onEdit, onDelete, index = 0 }: ProjectCardProps) => {
  const theme = useTheme();
  const [pressed, setPressed] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');

  // Animations
  const fadeScaleStyle = useStaggeredAnimation(index, true);
  const pressStyle = usePressAnimation(pressed);

  // Log when project data changes, especially progress
  useEffect(() => {
    console.log(`ProjectCard: ${project.name}, Progress: ${project.progress}%, Updated: ${new Date(project.updated_at || 0).toISOString()}`);
  }, [project.id, project.progress, project.updated_at]);

  // Load company name if company_id exists
  useEffect(() => {
    const loadCompanyName = async () => {
      if (project.company_id) {
        try {
          const company = await getCompanyById(project.company_id);
          setCompanyName(company.name);
        } catch (error) {
          console.error('Error loading company:', error);
          setCompanyName('');
        }
      } else {
        setCompanyName('');
      }
    };

    loadCompanyName();
  }, [project.company_id]);

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Not set';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };



  return (
    <Animated.View style={[fadeScaleStyle]}>
      <Pressable
        onPress={() => onPress(project)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        <Animated.View style={[pressStyle]}>
          <Card
            style={[
              styles.card,
              shadows.md,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Card.Content style={styles.content}>
              <View style={styles.statusContainer}>
                <View style={styles.chipWrapper}>
                  <StatusBadge status={project.status} size="medium" />
                </View>
              </View>

              <View style={styles.header}>
                <View style={styles.nameContainer}>
                  <Avatar.Icon
                    size={40}
                    icon="office-building"
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    color={theme.colors.primary}
                  />
                  <View style={styles.titleContainer}>
                    <Text variant="titleMedium" style={styles.title}>
                      {project.name}
                    </Text>
                    {companyName && (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Company: {companyName}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.progressContainer}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Progress: {project.progress || 0}%
                  </Text>
                  <ProgressBar
                    progress={(project.progress || 0) / 100}
                    color={theme.colors.primary}
                    style={styles.progressBar}
                  />
                  {/* Hidden text to force re-render when progress changes */}
                  <Text style={{ height: 0, width: 0, opacity: 0 }}>
                    {`${project.id}-${project.progress}-${project.updated_at || Date.now()}`}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons
                      name="calendar-range"
                      size={16}
                      color={theme.colors.onSurfaceVariant}
                      style={styles.infoIcon}
                    />
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatDate(project.start_date)} - {formatDate(project.end_date)}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons
                      name="currency-inr"
                      size={16}
                      color={theme.colors.onSurfaceVariant}
                      style={styles.infoIcon}
                    />
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatCurrency(project.total_budget)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                {onEdit && (
                  <IconButton
                    icon="pencil"
                    size={20}
                    iconColor={theme.colors.secondary}
                    onPress={() => onEdit(project)}
                  />
                )}
                {onDelete && project.id && (
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor={theme.colors.error}
                    onPress={() => onDelete(project.id!)}
                  />
                )}
              </View>
            </Card.Content>
          </Card>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  content: {
    padding: spacing.sm,
    position: 'relative',
  },
  statusContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    maxWidth: '50%', // Limit width to prevent overflow
    display: 'flex',
    alignItems: 'center', // Center horizontally
    justifyContent: 'center', // Center vertically
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContainer: {
    marginLeft: spacing.sm,
    flex: 1,
    paddingRight: spacing.xl, // Make space for the status chip
  },
  title: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  chipWrapper: {
    alignItems: 'center', // Center the chip horizontally
    justifyContent: 'center', // Center the chip vertically
    width: '100%', // Take full width of container
  },
  statusChip: {
    height: 32,
    paddingHorizontal: 0, // Minimal horizontal padding
    paddingVertical: 0, // Minimal vertical padding
    minWidth: 80, // Reduced minimum width for the chip
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    textAlign: 'center', // Center text
    textAlignVertical: 'center', // Center text vertically
  },
  detailsContainer: {
    marginTop: spacing.sm,
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

export default ProjectCard;

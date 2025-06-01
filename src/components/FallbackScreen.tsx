import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  useTheme,
  Divider,
  List
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DebugLogger } from '../utils/debugUtils';

interface FallbackScreenProps {
  error?: string;
  onRetry?: () => void;
  onShowDebug?: () => void;
}

const FallbackScreen: React.FC<FallbackScreenProps> = ({
  error,
  onRetry,
  onShowDebug
}) => {
  const theme = useTheme();

  const handleBasicTest = async () => {
    try {
      DebugLogger.info('Running basic app test...');
      // Test basic functionality
      const testResult = 'Basic functionality test passed';
      DebugLogger.info(testResult);
      alert(testResult);
    } catch (err) {
      DebugLogger.error('Basic test failed', err);
      alert('Basic test failed');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={64} 
          color={theme.colors.error} 
        />
        <Text variant="headlineMedium" style={styles.title}>
          App Initialization Issue
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          The app encountered an issue during startup
        </Text>
      </View>

      {error && (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.errorTitle}>
              Error Details:
            </Text>
            <Text variant="bodyMedium" style={styles.errorText}>
              {error}
            </Text>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.actionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.actionTitle}>
            Troubleshooting Options
          </Text>
          
          <Divider style={styles.divider} />
          
          <List.Section>
            <List.Item
              title="Retry Initialization"
              description="Attempt to restart the app initialization process"
              left={(props) => <List.Icon {...props} icon="refresh" />}
              onPress={onRetry}
              disabled={!onRetry}
            />
            
            <List.Item
              title="Show Debug Information"
              description="View detailed logs and system information"
              left={(props) => <List.Icon {...props} icon="bug" />}
              onPress={onShowDebug}
              disabled={!onShowDebug}
            />
            
            <List.Item
              title="Test Basic Functionality"
              description="Run a basic functionality test"
              left={(props) => <List.Icon {...props} icon="test-tube" />}
              onPress={handleBasicTest}
            />
          </List.Section>
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.infoTitle}>
            Common Solutions
          </Text>
          
          <View style={styles.solutionsList}>
            <Text variant="bodyMedium" style={styles.solutionItem}>
              • Restart the app completely
            </Text>
            <Text variant="bodyMedium" style={styles.solutionItem}>
              • Clear app data and cache
            </Text>
            <Text variant="bodyMedium" style={styles.solutionItem}>
              • Ensure device has sufficient storage
            </Text>
            <Text variant="bodyMedium" style={styles.solutionItem}>
              • Check device compatibility
            </Text>
            <Text variant="bodyMedium" style={styles.solutionItem}>
              • Reinstall the app if issues persist
            </Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          SAMVIDA CRM v1.0.0
        </Text>
        <Text variant="bodySmall" style={styles.footerText}>
          If problems persist, please contact support
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  title: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#ffebee',
  },
  errorTitle: {
    color: '#d32f2f',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#666',
    lineHeight: 20,
  },
  actionCard: {
    marginBottom: 16,
  },
  actionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  infoCard: {
    marginBottom: 16,
    backgroundColor: '#e3f2fd',
  },
  infoTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  solutionsList: {
    paddingLeft: 8,
  },
  solutionItem: {
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    opacity: 0.6,
    marginBottom: 4,
  },
});

export default FallbackScreen;

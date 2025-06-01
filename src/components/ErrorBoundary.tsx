import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { DebugLogger } from '../utils/debugUtils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log the error
    DebugLogger.error('React Error Boundary caught an error', error);
    DebugLogger.error('Error Info', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.title}>
                Something went wrong
              </Text>
              
              <Text variant="bodyMedium" style={styles.description}>
                The app encountered an unexpected error. This has been logged for debugging.
              </Text>

              {this.state.error && (
                <View style={styles.errorDetails}>
                  <Text variant="titleSmall" style={styles.errorTitle}>
                    Error Details:
                  </Text>
                  <Text variant="bodySmall" style={styles.errorText}>
                    {this.state.error.message}
                  </Text>
                </View>
              )}

              <View style={styles.actions}>
                <Button 
                  mode="contained" 
                  onPress={this.handleReset}
                  style={styles.button}
                >
                  Try Again
                </Button>
                
                <Button 
                  mode="outlined" 
                  onPress={() => DebugLogger.showDebugInfo()}
                  style={styles.button}
                >
                  Show Debug Info
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorCard: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorDetails: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#d32f2f',
  },
  errorText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

export default ErrorBoundary;

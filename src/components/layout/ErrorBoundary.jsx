import React from 'react';
import { Container, Title, Text, Button, Stack, Paper, Center } from '@mantine/core';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Center style={{ minHeight: '100vh', padding: '20px' }}>
          <Container size="sm">
            <Paper withBorder p="xl" radius="md" shadow="sm">
              <Stack align="center" gap="lg">
                <Title order={2} c="red">Something went wrong</Title>
                <Text size="md" ta="center">
                  The application encountered an unexpected error. This has been logged for review.
                </Text>
                {this.state.error && (
                  <Paper withBorder p="xs" bg="gray.1" style={{ width: '100%' }}>
                    <Text size="xs" ff="monospace" style={{ wordBreak: 'break-all' }}>
                      {this.state.error.toString()}
                    </Text>
                  </Paper>
                )}
                <Button 
                  variant="filled" 
                  color="pink" 
                  onClick={this.handleReset}
                >
                  Refresh Page
                </Button>
              </Stack>
            </Paper>
          </Container>
        </Center>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

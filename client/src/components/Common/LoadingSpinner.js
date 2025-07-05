import React from 'react';
import {
  Box,
  Spinner,
  Text,
  VStack,
  Center,
} from '@chakra-ui/react';

const LoadingSpinner = ({ 
  size = 'lg', 
  message = 'Loading...', 
  fullScreen = true,
  color = 'health.primary' 
}) => {
  const content = (
    <VStack spacing={4}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color={color}
        size={size}
      />
      {message && (
        <Text color="gray.600" fontSize="sm" textAlign="center">
          {message}
        </Text>
      )}
    </VStack>
  );

  if (fullScreen) {
    return (
      <Center minH="100vh" bg="health.background">
        {content}
      </Center>
    );
  }

  return (
    <Box py={8}>
      <Center>
        {content}
      </Center>
    </Box>
  );
};

export default LoadingSpinner;
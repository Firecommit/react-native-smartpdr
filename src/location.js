import React from 'react';
import { StyleSheet, Button, Text, View } from 'react-native';

export function LocationScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text>Location Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

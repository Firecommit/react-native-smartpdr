import React from 'react';
import { View, Text, Button } from 'react-native';
import { Props } from './types';

export const FeedScreen = ({ navigation }: Props) => {
  const ListOption = {
    Sensors: { title: 'Embeded Sensors Example' },
  };
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '500', marginBottom: 32 }}>
        SmartPDR for React Native
      </Text>
      {Object.entries(ListOption).map(([root, opt]) => (
        <Button
          key={root}
          title={opt.title}
          onPress={() => {
            navigation.navigate(root);
          }}
        />
      ))}
    </View>
  );
};

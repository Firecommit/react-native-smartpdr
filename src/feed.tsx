import React from 'react';
import { View, Text, Button } from 'react-native';
import { Props } from './types/navigator';

export const FeedScreen = ({ navigation }: Props) => {
  const ListOption = {
    Attitude: { title: 'Device Attitude Estimation' },
    Step: { title: 'Step Event Detection' },
    Heading: { title: 'Heading Direction Estimation' },
    Length: { title: 'Step Length Estimation' },
    Location: { title: 'Indoor Location Estimation' },
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

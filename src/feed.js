import React from 'react';
import { Dimensions, StyleSheet, View, ScrollView, Text } from 'react-native';
import { List, Surface } from 'react-native-paper';

export function FeedScreen({ navigation }) {
  const ListItem = {
    Attitude: { title: 'Attitude Estimation', icon: '' },
    StepEvent: { title: 'Step Event Detection', icon: 'walk' },
    HeadingDirection: {
      title: 'Heading Direction Estimation',
      icon: 'compass-outline',
    },
    StepLength: { title: 'Step Length Estimation', icon: 'run' },
    Location: {
      title: 'Location Estimation',
      icon: 'map-marker-radius-outline',
    },
  };
  return (
    <View style={styles.container}>
      <ScrollView>
        <List.Section style={styles.list}>
          <List.Subheader>SmartPDR for React Native</List.Subheader>
          {Object.entries(ListItem).map(([rootName, params], idx) => (
            <Surface key={idx} style={{ marginBottom: 8, elevation: 2 }}>
              <List.Item
                title={params.title}
                left={() => <List.Icon icon={params.icon} />}
                right={() => <List.Icon icon="chevron-right" />}
                onPress={() => {
                  navigation.navigate(rootName);
                }}
              />
            </Surface>
          ))}
        </List.Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  list: {
    padding: 8,
    width: Dimensions.get('window').width,
  },
});

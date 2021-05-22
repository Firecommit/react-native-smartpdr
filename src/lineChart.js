import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

export function RealTimeLineChart({ dataList }) {
  const data = {
    datasets: [
      {
        data: dataList.step,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      },
    ],
    legend: ['Step acceleration'],
  };

  return (
    <View>
      <LineChart
        data={data}
        width={screenWidth}
        height={250}
        chartConfig={chartConfig}
        style={styles.lineChart}
        withShadow={false}
        withDots={false}
        withInnerLines={false}
        withOuterLines={false}
        fromZero={true}
      />
    </View>
  );
}

const screenWidth = Dimensions.get('window').width - 16;

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 1,
  useShadowColorFromDataset: false,
};

const styles = StyleSheet.create({
  lineChart: {
    marginBottom: 64,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowRadius: 4,
    shadowOpacity: 0.3,
    elevation: 2,
  },
});

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

export function RealTimeLineChart({ x, y, z }) {
  const [dataList, setDataList] = React.useState({ x: [0], y: [0], z: [0] });
  const threshold = 10;

  React.useEffect(() => {
    dataList.x.length > threshold ? dataList.x.shift() : dataList.x.push(x);
  }, [x]);

  React.useEffect(() => {
    dataList.y.length > threshold ? dataList.y.shift() : dataList.y.push(y);
  }, [y]);

  React.useEffect(() => {
    dataList.z.length > threshold ? dataList.z.shift() : dataList.z.push(z);
  }, [z]);

  const data = {
    datasets: [
      {
        data: dataList.x,
        color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
      },
      {
        data: dataList.y,
        color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
      },
      {
        data: dataList.z,
        color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
      },
    ],
    legend: ['x-axis', 'y-axis', 'z-axis'],
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
        withInnerLines={false}
        withOuterLines={false}
        fromZero={true}
        bezier
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

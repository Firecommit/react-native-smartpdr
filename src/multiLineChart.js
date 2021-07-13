import React from 'react';
import { StyleSheet, View, Platform, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { ActivityIndicator, useTheme } from 'react-native-paper';

const html = require('../assets/html/index.html');

const download = async () => {
  let file = Asset.fromModule(html);
  if (file.localUri !== null) return file;
  await file.downloadAsync();
  return file;
};

const getSource = (file) => {
  if (Platform.OS !== 'android') return html;
  if (file === null) return {};
  return { uri: file.localUri };
};

const styles = StyleSheet.create({
  canvasContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowRadius: 4,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  canvas: {
    overflow: 'hidden',
    width: Dimensions.get('window').width - 16,
    height: 270,
    marginVertical: 16,
    borderRadius: 8,
  },
});

export function MultiLineChart({ data }) {
  const theme = useTheme();
  const [file, setFile] = React.useState(null);
  const [code, setCode] = React.useState(null);
  const webref = React.useRef(null);

  React.useEffect(() => {
    if (Platform.OS === 'android') {
      download().then((downloadFile) => {
        setFile(downloadFile);
      });
    }
    setCode(`
      function formatDate(date) {
        let m = date.getMinutes();
        let s = date.getSeconds();
        let ms = date.getMilliseconds();
        return m + ':' + s + '.' + ms;
      }
      var ctx = document.getElementById('chart').getContext('2d');
      var chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Dataset 1',
              data: [],
              backgroundColor: 'rgba(255, 0, 0, 0.5)',
              borderColor: 'rgb(255, 0, 0, 0.5)',
              tension: 0.1,
            },
            {
              label: 'Dataset 2',
              data: [],
              backgroundColor: 'rgba(0, 0, 255, 0.5)',
              borderColor: 'rgb(0, 0, 255, 0.5)',
              tension: 0.1,
            },
            {
              label: 'Dataset 3',
              data: [],
              backgroundColor: 'rgba(0, 0, 0, 1)',
              borderColor: 'rgb(0, 0, 0, 1)',
              tension: 0.1,
            },
          ],
        },
        options: {
          fill: false,
          interaction: {
            intersect: true
          },
          radius: 0,
        },
      });
      true;
    `);
  }, []);

  React.useEffect(() => {
    let updateCode = `
      var set_one = chart.data.datasets[0].data;
      set_one.push(${data[0]});
      var set_two = chart.data.datasets[1].data;
      set_two.push(${data[1]});
      var set_three = chart.data.datasets[2].data;
      set_three.push(${data[2]});
      chart.data.labels.push(formatDate(new Date()));

      if(set_one.length > 150) {
        set_one.shift();
        set_two.shift();
        set_three.shift();
        chart.data.labels.shift();
      }
      chart.update('none');
    `;
    webref.current.injectJavaScript(updateCode);
  }, [data]);

  return (
    <View style={styles.canvasContainer}>
      <View style={styles.canvas}>
        <WebView
          ref={webref}
          allowFileAccess={true}
          source={getSource(file)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={(event) => {}}
          injectedJavaScript={code}
          renderLoading={() => {
            return (
              <ActivityIndicator
                style={{ position: 'absolute', width: '100%', height: '100%' }}
                animating={true}
                color={theme.colors.primary}
              />
            );
          }}
          startInLoadingState={true}
        />
      </View>
    </View>
  );
}

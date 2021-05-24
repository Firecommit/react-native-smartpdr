import React from 'react';
import { StyleSheet, Platform, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { Surface } from 'react-native-paper';

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
  canvas: {
    width: Dimensions.get('window').width - 16,
    height: 260,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 4,
  },
});

export function RealTimeLineChart({ step }) {
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
              label: 'Step Acceleration',
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
            intersect: false
          },
          radius: 0,
        },
      });
      true;
    `);
  }, []);

  React.useEffect(() => {
    let updateCode = `
      var step = chart.data.datasets[0].data;
      step.push(${step});
      chart.data.labels.push(formatDate(new Date()));

      if(step.length > 100) {
        step.shift();
        chart.data.labels.shift();
      }
      chart.update('none');
    `;
    webref.current.injectJavaScript(updateCode);
  }, [step]);

  return (
    <Surface style={styles.canvas}>
      <WebView
        ref={webref}
        allowFileAccess={true}
        source={getSource(file)}
        javaScriptEnabled={true}
        onMessage={(event) => {}}
        injectedJavaScript={code}
        startInLoadingState
      />
    </Surface>
  );
}

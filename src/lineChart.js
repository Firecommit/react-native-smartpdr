import React, { useState, useEffect, useRef } from 'react';
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

export function RealTimeLineChart({ title, data }) {
  const theme = useTheme();
  const [file, setFile] = useState(null);
  const [code, setCode] = useState(null);
  const webref = useRef(null);

  useEffect(() => {
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
              label: '${title}',
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

  useEffect(() => {
    let updateCode = `
      var step = chart.data.datasets[0].data;
      step.push(${data});
      chart.data.labels.push(formatDate(new Date()));

      if(step.length > 150) {
        step.shift();
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

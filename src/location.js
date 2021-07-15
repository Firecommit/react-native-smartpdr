import React from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { Accelerometer, Magnetometer, Gyroscope } from 'expo-sensors';
import { Button } from 'react-native-paper';
import Canvas from 'react-native-canvas';

// custom modules
import { styles } from './utils/styles';
import { useHeading } from './utils/customHooks';
import { RealTimeLineChart } from './lineChart';
import { range, round } from './utils/sensors_utils';

export function LocationScreen({ navigation }) {
  // Listeners
  const [acc, setAcc] = React.useState({ x: 0, y: 0, z: 0 });
  const [mag, setMag] = React.useState({ x: 0, y: 0, z: 0 });
  const [gyr, setGyr] = React.useState({ x: 0, y: 0, z: 0 });
  const canvasRef = React.useRef(null);
  const [lineWidth, setLineWidth] = React.useState({ val: 2.5, sum: 0.2 });

  // Custom Hooks
  const heading = useHeading(acc, mag, gyr);

  // Constant declarations
  const dt = 100;
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height - 64;

  Accelerometer.setUpdateInterval(dt);
  Magnetometer.setUpdateInterval(dt);
  Gyroscope.setUpdateInterval(dt);

  React.useEffect(() => {
    Accelerometer.addListener((data) => {
      setAcc(data);
    });
    Magnetometer.addListener((data) => {
      setMag(data);
    });
    Gyroscope.addListener((data) => {
      setGyr(data);
    });
    _handleCanvas(canvasRef.current);
    return () => {
      Accelerometer.removeAllListeners();
      Magnetometer.removeAllListeners();
      Gyroscope.removeAllListeners();
    };
  }, [navigation]);

  React.useEffect(() => {
    if (lineWidth.val > 5 || lineWidth.val < 2.5) {
      setLineWidth((lw) => ({ ...lw, sum: -lw.sum }));
    }
    setLineWidth((lw) => ({ ...lw, val: lw.val + lw.sum }));
    _handleCanvas(canvasRef.current);
  }, [heading]);

  const _handleCanvas = (canvas) => {
    canvas.width = windowWidth;
    canvas.height = windowHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    _current_user(ctx, canvas.width / 2, canvas.height / 2);
  };

  const _current_user = (ctx, x, y) => {
    // user around field
    ctx.beginPath();
    ctx.fillStyle = 'rgba(252, 129, 50, 0.1)';
    ctx.strokeStyle = 'fc8132';
    ctx.lineWidth = 0.3;
    ctx.arc(x, y, 40, (0 * Math.PI) / 180, (360 * Math.PI) / 180, false);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
    // user heading direction
    ctx.beginPath();
    ctx.fillStyle = 'rgba(252, 129, 50, 0.3)';
    ctx.arc(
      x,
      y,
      55,
      heading - (20 * Math.PI) / 180,
      heading + (20 * Math.PI) / 180,
      false
    );
    ctx.lineTo(x, y);
    ctx.fill();
    ctx.closePath();
    // shadow #1
    ctx.shadowColor = 'gray';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 10;
    // user circle
    ctx.beginPath();
    ctx.fillStyle = 'fc8132';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = lineWidth.val;
    ctx.arc(x, y, 10, (0 * Math.PI) / 180, (360 * Math.PI) / 180, false);
    ctx.fill();
    // shadow #2
    ctx.shadowColor = 'gray';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    // user circle stroke
    ctx.stroke();
    ctx.closePath();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#B9B9B9' }}>
      <Canvas ref={canvasRef} />
    </View>
  );
}

<p align="center">
  <img alt="react-native-smartpdr" src="./assets/react-native-smartpdr-logo.png" width=480>
</p>
<p style="margin-top:20px" align="center">
  SmartPDR(Smartphone-Based Pedestrian Dead Reckoning for Indoor Localization) for React Native.<br/>
</p>

---

<p align="right">
  <img alt="npm" src="https://img.shields.io/badge/npm-7.11.1-blue" />
  <img alt="build" src="https://img.shields.io/badge/build-unknown-lightgrey" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-green" />
</p>

SmartPDR for React Native is a React-based pedestrian dead reckoning library aiming at applying cross platform.
It provides device inclination angle calculation Hooks based on the Euler angles introduced by Leonhard Euler as well as practical indoor movement tracking Hooks to estimate user location.

## Install & Try it out

```sh
$ git clone https://github.com/Firecommit/react-native-smartpdr.git
$ cd react-native-smartpdr
$ npm install
```

Run the example app with Expo to see in action.

```sh
$ npm start
```

The source code for the examples are under the `/src` directory.

## Hooks

```js
import {
  useAttitude,
  useAccStep,
  useHeading,
  useStepLength,
} from 'src/utils/customHooks';
```

### useAttitude

```js
const { pitch, roll, yaw } = useAttitude(
  accelerometerData,
  magnetometerData,
  gyroscopeData
);
```

### useAccStep

```js
const [accStep, accEvent] = useAccStep(
  accelerometerData,
  magnetometerData,
  gyroscopeData
);
```

### useHeading

```js
const heading = useHeading(accelerometerData, magnetometerData, gyroscopeData);
```

### useStepLength

```js
const [stepLength, headingStep] = useStepLength(
  accelerometerData,
  magnetometerData,
  gyroscopeData
);
```

## License

MIT License (see `LICENSE` file).

```
The MIT License (MIT)

Copyright (c) 2021 Firecommit

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## References

### From Paper

Kang, Wonho, and Youngnam Han. "SmartPDR: Smartphone-based pedestrian dead reckoning for indoor localization." IEEE Sensors journal 15.5 (2014): 2906-2916. [URL](https://ieeexplore.ieee.org/abstract/document/6987239), [BibTex](https://scholar.googleusercontent.com/scholar.bib?q=info:QYXi1-SzlfcJ:scholar.google.com/&output=citation&scisdr=CgX2mC7sEKGE4BtzygI:AAGBfm0AAAAAYPJ20gIpTV-JX0YN46W2WXFj5lAVAPSH&scisig=AAGBfm0AAAAAYPJ20nzzmWdiJwKnY2vxguetleHY_6kM&scisf=4&ct=citation&cd=-1&hl=ja)

Nelson, Robert C. Flight stability and automatic control. Vol. 2. New York: WCB/McGraw Hill, 1998. [URL](https://www.academia.edu/download/60466651/Flight_Stability_and_Automatic_Control20190902-80669-149kism.pdf), [BibTeX](https://scholar.googleusercontent.com/scholar.bib?q=info:p_pYM2FDW64J:scholar.google.com/&output=citation&scisdr=CgX2mC7sENC_rxd_HxQ:AAGBfm0AAAAAYPJ6BxQek_6v6m4nqZayZWm_F1Q8-vHH&scisig=AAGBfm0AAAAAYPJ6B5g4WffUCq034iVKKtWCZfwv2a3c&scisf=4&ct=citation&cd=-1&hl=ja)

Ladetto, Quentin, and Bertrand Merminod. "An alternative approach to vision techniques-pedestrian navigation system based on digital magnetic compass and gyroscope integration." 6th World Multiconference on Systemics, Cybernetics and Information, Orlando, USA. No. CONF. 2002. [URL](https://infoscience.epfl.ch/record/29193), [BibTeX](https://scholar.googleusercontent.com/scholar.bib?q=info:5pNywPPZF0wJ:scholar.google.com/&output=citation&scisdr=CgX2mC7sEKGE4BuZQdQ:AAGBfm0AAAAAYPKcWdQCeDlj-SS1lKf398l1nn6Qxtpr&scisig=AAGBfm0AAAAAYPKcWR6Pg-nR2E79ZFIavxbr5s-T9BLZ&scisf=4&ct=citation&cd=-1&hl=ja)

### From Websites

Measuring Motion | Masterclass, In this Masterclass, we introduce a number of sensors commonly used in robotics to measure motion: accelerometers, magnetometers and gyroscopes. [URL](https://robotacademy.net.au/masterclass/measuring-motion/)

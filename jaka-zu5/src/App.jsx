import { useState } from 'react';
import 'aframe';
import '@ucl-nuee/robot-loader/robotRegistry.js';
import '@ucl-nuee/robot-loader/robotLoader.js';
import '@ucl-nuee/robot-loader/reflectWorkerJoints.js';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <a-scene xr-mode-ui="XRMode: ar">
      <a-entity id="robot-registry"
                robot-registry >
      </a-entity>
      <a-entity camera position="-0.5 1.2 1.7"
                look-controls="enabled: false"></a-entity>
      <a-circle id="jaka-hand1-a"
                robot-loader="model: jaka_hand_A"
                set-joints-directly-in-degree="60, 30"

                position="0.25 0.5 -2" rotation="-90 0 90"
                radius="0.03"
                color="blue"
                material="opacity: 0.5; transparent: true;"
      />
      <a-circle id="jaka-hand1-b"
                robot-loader="model: jaka_hand_B"
                set-joints-directly-in-degree="60, 30"

                position="0.25 0.5 -2" rotation="-90 0 90"
                radius="0.03"
                color="blue"
                material="opacity: 0.5; transparent: true;"
      />
      <a-sky color="#ECECEC"></a-sky>
    </a-scene>
  );
}

export default App

// JakaHandEntity.jsx
import React, { forwardRef, useRef, useImperativeHandle } from "react";

const JakaHandEntity = forwardRef((props, ref) => {
  const entityRef = useRef();
  const robotModel = props.robotModel || "jaka_zu_5";
  const position = props.position;
  const fingerAngleDeg = props.fingerAngle*180/Math.PI || 0; // 指の開閉角度の調整
  const thetaF=-20 + fingerAngleDeg;
  const thetaF2a=thetaF+180;
  const thetaF2b=-thetaF-180;
  const thetaF3a=-thetaF-0;
  const thetaF3b=thetaF+180;

  // 親がアクセスできる値を公開
  useImperativeHandle(ref, () => ({
    el: entityRef.current
  }));


  const Assets = ({id,src}) => {
    const assetExists = document.getElementById(id);
    return assetExists
      ? null
      : <a-asset-items id={id} src={src} ></a-asset-items>;
  };
  return (
    <>
      {/* AG-160-90 hand */}
      <a-assets>
        <Assets id="ag160_95_2a" src={`/${robotModel}/AG-160-95-2a.glb`} />
        <Assets id="ag160_95_2b" src={`/${robotModel}/AG-160-95-2b.glb`} />
        <Assets id="ag160_95_3a" src={`/${robotModel}/AG-160-95-3a.glb`} />
        <Assets id="ag160_95_3b" src={`/${robotModel}/AG-160-95-3b.glb`} />
        <Assets id="ag160_95_4a" src={`/${robotModel}/AG-160-95-4a.glb`} />
        <Assets id="ag160_95_4b" src={`/${robotModel}/AG-160-95-4b.glb`} />
      </a-assets>
      <a-cylinder position="1.25 0.2 -0.75"
                  radius="0.12" height="0.4" color="#FFC65D"
                  material="opacity: 0.35; transparent: true">
        <a-entity ref={entityRef}
                  gltf-model="#ag160_95_1" position='0.01 0 0.15' rotation='0 180 0'> 
          <a-entity gltf-model='#ag160_95_2a' position='-0.02 0 -0.06' rotation={`0 ${thetaF2a}  0` }>
            <a-entity gltf-model='#ag160_95_4a' position='0.0 0 0.055' rotation={`180 ${thetaF3a}  0` }>
              <a-entity gltf-model='#ag160_95_3b' position='-0.0 0 -0.02' rotation={`0 180 -90` }>
              </a-entity>
            </a-entity>
          </a-entity>
          <a-entity gltf-model='#ag160_95_2b' position='0.04 0 -0.06' rotation={`0 ${thetaF2b} 0` }>
            <a-entity gltf-model='#ag160_95_4b' position='-0.0 0 0.055' rotation={`0 ${thetaF3b} 0` }>
              <a-entity gltf-model='#ag160_95_3b' position='-0.0 0 -0.02' rotation={`0 180 -90` }>
              </a-entity>
            </a-entity>
          </a-entity>
        </a-entity>
      </a-cylinder>
    </>
  );
});

JakaHandEntity.displayName = 'JakaHandEntity';
export default JakaHandEntity;


// example for App.jsx
// import React, { useRef, useEffect } from "react";
// import JakaHandEntity from "./JakaHandEntity";

// export default function App() {
//   const boxRef = useRef();
//   const parentRef = useRef();

//   useEffect(() => {
//     if (boxRef.current && parentRef.current) {
//       // 子の a-entity DOM を別の親 entity に append
//       parentRef.current.appendChild(boxRef.current.el);
//     }
//   }, []);

//   return (
//     <a-scene ref={parentRef}>
//       <JakaHandEntity ref={boxRef} />
//     </a-scene>
//   );
// }

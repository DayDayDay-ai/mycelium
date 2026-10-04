"use client";
import { Suspense, useEffect, useMemo, useState, Component, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  useGLTF,
  Center,
} from "@react-three/drei";
import * as THREE from "three";
import { Rotate3D, ZoomIn } from "lucide-react";
function Imported({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => {
    const copy = scene.clone();
    const size = new THREE.Box3()
      .setFromObject(copy)
      .getSize(new THREE.Vector3());
    copy.scale.multiplyScalar(3.5 / Math.max(size.x, size.y, size.z, 0.001));
    return copy;
  }, [scene]);
  return (
    <Center>
      <primitive object={model} />
    </Center>
  );
}
function specimenProfile(species: string, shape: string) {
  const bolete=shape==='bolete',funnel=shape==='chanterelle'||['voronochnik','ryzhik','gruzd'].includes(species),oyster=species==='veshenka';
  const slender=['galerina','openok','openok-letniy','lozhnyy-openok','enoki','zontik'].some(s=>species===s);
  const leccinum=['podberezovik','podosinovik'].includes(species);
  return {radius:oyster?1.5:slender?1.25:funnel?1.55:1.65,height:funnel?0.6:slender?0.45:species==='muhomor-vonyuchiy'?1.25:bolete?0.95:0.65,dome:species==='muhomor-vonyuchiy'?1.1:0.5,
    stem:leccinum?0.31:bolete?0.52:slender?0.18:funnel?0.3:0.29,
    stemColor:species==='ryadovka-fioletovaya'?'#b49ac2':funnel?'#d8b35d':'#e4d7bd',
    underside:species.startsWith('shampinion')?'#745547':species==='ryadovka-fioletovaya'?'#af93bc':bolete?'#d6ca87':funnel?'#dfb652':'#e6dfcb',
    funnel,oyster,pores:bolete,flecks:leccinum,gloss:species.startsWith('maslenok'),ring:species.startsWith('maslenok')||species==='openok'||species==='zontik'||species.startsWith('shampinion')};
}
function surfaceTexture(fibrous: boolean) {
  const size=256,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const index=(y*size+x)*4;
    const grain=(Math.sin(x*127.1+y*311.7)*43758.5453)%1;
    const lines=fibrous ? Math.sin(x*0.95+Math.sin(y*0.035)*0.8)*28+Math.sin(x*2.9)*9 : Math.sin(x*0.19)*Math.sin(y*0.23)*13;
    const value=Math.max(0,Math.min(255,145+grain*17+lines));
    data[index]=data[index+1]=data[index+2]=value;data[index+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;texture.needsUpdate=true;
  texture.repeat.set(fibrous?2:3,fibrous?1:3);
  return texture;
}
function RingSkirt({radius,y}: {radius:number;y:number}) {
  const geometry=useMemo(()=>{
    const g=new THREE.LatheGeometry([new THREE.Vector2(radius*0.58,0.07),new THREE.Vector2(radius,0),new THREE.Vector2(radius*1.1,-0.14)],64);
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++) {
      const angle=Math.atan2(p.getZ(i),p.getX(i));
      p.setY(i,p.getY(i)+Math.sin(angle*16)*0.018);
    }
    g.computeVertexNormals();return g;
  },[radius]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh position={[0,y,0]} geometry={geometry}><meshStandardMaterial color="#e7dfcd" side={THREE.DoubleSide} roughness={0.95}/></mesh>;
}
export function MushroomModel({
  color = "#e44333",
  shape = "amanita",
  species = "",
}: {
  color?: string;
  shape?: string;
  species?: string;
}) {
  const textures = useMemo(() => ({ cap:surfaceTexture(false),stem:surfaceTexture(true) }),[]);
  useEffect(() => () => {textures.cap.dispose();textures.stem.dispose();},[textures]);
  const profile = useMemo(() => specimenProfile(species, shape), [species, shape]);
  const cap = useMemo(() => {
    const points: THREE.Vector2[] = [];
    for (let i=0;i<=48;i++) {
      const t=i/48;
      const y=profile.funnel ? 0.12+profile.height*t*t : profile.height*Math.pow(Math.max(0,1-t*t),profile.dome);
      points.push(new THREE.Vector2(t*profile.radius,y));
    }
    points.push(new THREE.Vector2(profile.radius,-0.08),new THREE.Vector2(0.25,-0.16),new THREE.Vector2(0,-0.12));
    const geometry=new THREE.LatheGeometry(points.reverse(),96,0,profile.oyster ? Math.PI*1.5 : Math.PI*2);
    const positions=geometry.attributes.position;
    const colors=[]; const base=new THREE.Color(color);
    for(let i=0;i<positions.count;i++) {
      const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),angle=Math.atan2(z,x);
      const radial=Math.hypot(x,z)/profile.radius;
      const wave=Math.sin(angle*9+radial*3)*0.025+Math.sin(angle*17)*0.012;
      positions.setY(i,y+wave*radial*radial*(profile.funnel?3:1));
      const shade=0.93+0.07*Math.sin(x*13+z*9)*Math.sin(z*17)+0.08*radial;
      colors.push(base.r*shade,base.g*shade,base.b*shade);
    }
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();
    return geometry;
  }, [color, profile]);
  const stem = useMemo(() => new THREE.LatheGeometry([
    new THREE.Vector2(0,0),new THREE.Vector2(profile.stem*0.65,0),new THREE.Vector2(profile.stem,0.3),
    new THREE.Vector2(profile.stem*0.9,0.75),new THREE.Vector2(profile.stem*0.62,1.35),new THREE.Vector2(profile.stem*0.5,2.1),new THREE.Vector2(0,2.14)
  ],48),[profile]);
  useEffect(() => () => { cap.dispose(); stem.dispose(); },[cap,stem]);
  if (shape === "falsemorel") return <group position={[0, -0.8, 0]}><mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.4,0.5,1,32]}/><meshStandardMaterial color="#e4d7bd"/></mesh>{Array.from({length:18},(_,i)=>{const a=i*2.399,r=0.65+(i%3)*0.12;return <mesh key={i} position={[Math.cos(a)*r,1+(i%4)*0.15,Math.sin(a)*r]} scale={[0.6,0.55,0.5]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={color} roughness={1}/></mesh>})}</group>;
  if (shape === "puffball") return <mesh position={[0, 0, 0]} scale={[1.4, 1.25, 1.4]}><sphereGeometry args={[1, 64, 48]}/><meshStandardMaterial color={color} bumpMap={textures.cap} bumpScale={0.045} roughness={0.95}/></mesh>;
  if (shape === "bracket" || shape === "hoof") return <group rotation={[0, -0.5, 0]}>{Array.from({length: shape === "hoof" ? 1 : 3}, (_, i) => <mesh key={i} position={[0, i * 0.5 - 0.6, -i * 0.25]} scale={[1.7 - i * 0.2, shape === "hoof" ? 1.1 : 0.25, 1.2]}><sphereGeometry args={[1, 48, 32, 0, Math.PI]}/><meshStandardMaterial color={color} bumpMap={textures.cap} bumpScale={0.06} side={THREE.DoubleSide} roughness={0.85}/></mesh>)}</group>;
  if (shape === "morel") return <group position={[0, -1.1, 0]}><mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.28, 0.4, 1.2, 32]}/><meshStandardMaterial color="#e4dac4"/></mesh><mesh position={[0, 1.8, 0]} scale={[0.8, 1.3, 0.8]}><sphereGeometry args={[1, 18, 12]}/><meshStandardMaterial color={color} bumpMap={textures.cap} bumpScale={0.035} roughness={1} flatShading/></mesh>{Array.from({length:60},(_,i)=>{const y = -0.9 + (i % 10) * 0.2, r = Math.sqrt(1-y*y)*0.82, a=i*2.399;return <mesh key={i} position={[Math.cos(a)*r,1.8+y*1.3,Math.sin(a)*r]} rotation={[0,a,0]} scale={[0.09,0.14,0.045]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color="#59452b"/></mesh>})}</group>;
  return (
    <group position={[0, -1.25, 0]} rotation={[0, 0, -0.07]}>
      <mesh position={[profile.oyster ? -0.5 : 0, 0, 0]} geometry={stem}>
        <meshStandardMaterial color={profile.stemColor} bumpMap={textures.stem} bumpScale={0.026} roughness={0.88} />
      </mesh>
      <mesh position={[0, 2.14, 0]} geometry={cap}>
        <meshStandardMaterial vertexColors bumpMap={textures.cap} bumpScale={profile.gloss?0.016:0.045} roughness={profile.gloss ? 0.25 : 0.72} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[profile.radius*0.97, 96, 0, profile.oyster ? Math.PI*1.5 : Math.PI*2]} />
        <meshStandardMaterial
          color={profile.underside}
          side={THREE.DoubleSide}
          roughness={0.8}
        />
      </mesh>
      {!profile.pores && Array.from({length:profile.funnel?44:72},(_,i)=> {
        const angle=i/(profile.funnel?44:72)*(profile.oyster?Math.PI*1.5:Math.PI*2);
        return <group key={'gill'+i} rotation={[0,angle,0]}><mesh position={[profile.radius*0.52,2.0,0]} rotation={[0,0,profile.funnel?0.13:0]}><boxGeometry args={[profile.radius*0.87,profile.funnel?0.09:0.055,0.013]}/><meshStandardMaterial color={profile.underside} bumpMap={textures.stem} bumpScale={0.008} roughness={0.95}/></mesh></group>;
      })}
      {profile.pores && Array.from({length:180},(_,i)=> {
        const r=Math.sqrt((i+0.5)/180)*profile.radius*0.93,a=i*2.399963;
        return <mesh key={'pore'+i} position={[Math.cos(a)*r,2.009,Math.sin(a)*r]} rotation={[Math.PI/2,0,0]}><circleGeometry args={[0.018,6]}/><meshStandardMaterial color="#8c854d" side={THREE.DoubleSide}/></mesh>;
      })}
      {profile.flecks && Array.from({length:90},(_,i)=> {
        const y=0.25+(i%18)*0.1,a=i*2.399963,r=profile.stem*(1-y*0.22);
        return <mesh key={'fleck'+i} position={[Math.cos(a)*r,y,Math.sin(a)*r]} scale={[0.019,0.035,0.013]}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial color="#534333"/></mesh>;
      })}
      {(profile.ring || shape.startsWith("amanita")) && <RingSkirt radius={shape.startsWith("amanita")?0.4:profile.stem*1.1} y={shape.startsWith("amanita")?1.5:1.3}/> }
      {profile.ring && !shape.startsWith('amanita') && <mesh position={[0,1.3,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[profile.stem*0.85,0.055,10,48]}/><meshStandardMaterial color={profile.stemColor}/></mesh>}
      {shape.startsWith("amanita") && (
        <>
          <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.35, 0.085, 12, 48]} />
            <meshStandardMaterial color="#f4e7cf" />
          </mesh>
          {shape === "amanita" && Array.from({ length: 45 }, (_, i) => {
            const radius = 0.15 + (((i * 17) % 100) / 100) * profile.radius*0.85;
            const angle = i * 2.399;
            const y = profile.height * Math.pow(1 - (radius * radius) / (profile.radius * profile.radius),profile.dome);
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(angle) * radius,
                  2.15 + y,
                  Math.sin(angle) * radius,
                ]}
                scale={[0.07, 0.035, 0.065]}
              >
                <dodecahedronGeometry />
                <meshStandardMaterial color="#fff0d4" roughness={1} />
              </mesh>
            );
          })}
        </>
      )}
      <mesh position={[0, 0.07, 0]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[shape === "amanita" ? 0.42 : 0.3, 32, 24]} />
        <meshStandardMaterial color="#e2d4b9" />
      </mesh>
    </group>
  );
}
class ViewerBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="viewer-fallback">
        3D недоступно. Проверьте WebGL или файл модели. Информация о виде
        доступна ниже.
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Viewer({
  color,
  shape,
  url,
  hero = false,
  species,
}: {
  color?: string;
  shape?: string;
  url?: string | null;
  hero?: boolean;
  species?: string;
}) {
  const [interacted, setInteracted] = useState(false);
  return (
    <div className={`viewer ${hero ? "hero-viewer" : ""}`}>
      <ViewerBoundary>
        <Canvas
          camera={{ position: [4, 2.7, 6], fov: 38 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
          fallback={<div>Для просмотра 3D включите WebGL</div>}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 3]} intensity={3} />
          <pointLight position={[-4, 3, -2]} color="#ac8aff" intensity={14} />
          <Suspense fallback={null}>
            {url ? (
              <Imported url={url} />
            ) : (
              <MushroomModel color={color} shape={shape} species={species} />
            )}
            <ContactShadows
              position={[0, -1.3, 0]}
              opacity={0.5}
              scale={10}
              blur={2}
              far={4}
            />
          </Suspense>
          <OrbitControls
            makeDefault
            autoRotate={!interacted}
            autoRotateSpeed={0.6}
            enablePan={false}
            minDistance={3}
            maxDistance={12}
            onStart={() => setInteracted(true)}
          />
        </Canvas>
      </ViewerBoundary>
      <span className="viewer-type">
        <Rotate3D size={14} /> {url ? "3D MODEL" : "УЧЕБНАЯ 3D-МОДЕЛЬ"}
      </span>
      {!interacted && (
        <span className="viewer-hint">
          DRAG TO ROTATE <span>↔</span>
        </span>
      )}
      <span className="viewer-zoom">
        <ZoomIn size={15} /> Колесо / pinch — масштаб
      </span>
    </div>
  );
}

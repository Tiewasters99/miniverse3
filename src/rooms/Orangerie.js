import * as THREE from 'three';

export function createOrangerie(scene, width, height, clickableObjectsRef, movableObjectsRef) {
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 5, 45);
  camera.lookAt(0, 8, -20);

  const skyGeo = new THREE.SphereGeometry(500, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color('#6a9fd4') },
      horizonColor: { value: new THREE.Color('#c8d8e8') },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        float blend = pow(max(h, 0.0), 0.5);
        gl_FragColor = vec4(mix(horizonColor, topColor, blend), 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  scene.add(new THREE.AmbientLight('#fff8f0', 0.4));
  const sun = new THREE.DirectionalLight('#fffae0', 1.0);
  sun.position.set(40, 60, 30);
  sun.castShadow = true;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight('#87ceeb', '#3d5c2e', 0.3));

  const limestone = new THREE.MeshStandardMaterial({ color: '#e8dcc0', roughness: 0.65 });
  const limestoneDark = new THREE.MeshStandardMaterial({ color: '#d0c4a8', roughness: 0.6 });
  const limestoneLight = new THREE.MeshStandardMaterial({ color: '#f0e8d8', roughness: 0.7 });
  const windowDark = new THREE.MeshStandardMaterial({ color: '#3a4550', roughness: 0.3 });
  const planterGreen = new THREE.MeshStandardMaterial({ color: '#5a8a7a', roughness: 0.5 });
  const foliageLight = new THREE.MeshStandardMaterial({ color: '#4a7a3a', roughness: 0.9 });
  const foliageDark = new THREE.MeshStandardMaterial({ color: '#2d4a25', roughness: 0.9 });
  const gravel = new THREE.MeshStandardMaterial({ color: '#d4c8b0', roughness: 0.9 });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: '#4a6a38' }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.2;
  scene.add(ground);

  const parterre = new THREE.Mesh(new THREE.BoxGeometry(90, 0.3, 45), gravel);
  parterre.position.set(0, 0.15, 0);
  scene.add(parterre);

  // Reflecting pool
  const poolWidth = 50, poolLength = 35, rimHeight = 0.8, poolCenterZ = 32;
  const borderMat = new THREE.MeshStandardMaterial({ color: '#b8a890', roughness: 0.6 });
  const frontBorder = new THREE.Mesh(new THREE.BoxGeometry(poolWidth + 2, rimHeight, 1.5), borderMat);
  frontBorder.position.set(0, rimHeight / 2, poolCenterZ + poolLength / 2 + 0.75);
  scene.add(frontBorder);
  const backBorder = new THREE.Mesh(new THREE.BoxGeometry(poolWidth + 2, rimHeight, 1.5), borderMat);
  backBorder.position.set(0, rimHeight / 2, poolCenterZ - poolLength / 2 - 0.75);
  scene.add(backBorder);
  const leftBorder = new THREE.Mesh(new THREE.BoxGeometry(1.5, rimHeight, poolLength + 2), borderMat);
  leftBorder.position.set(-poolWidth / 2 - 0.75, rimHeight / 2, poolCenterZ);
  scene.add(leftBorder);
  const rightBorder = new THREE.Mesh(new THREE.BoxGeometry(1.5, rimHeight, poolLength + 2), borderMat);
  rightBorder.position.set(poolWidth / 2 + 0.75, rimHeight / 2, poolCenterZ);
  scene.add(rightBorder);

  const waterSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(poolWidth, poolLength),
    new THREE.MeshStandardMaterial({ color: '#4a90b8', roughness: 0.1, metalness: 0.3 })
  );
  waterSurface.rotation.x = -Math.PI / 2;
  waterSurface.position.set(0, rimHeight - 0.15, poolCenterZ);
  scene.add(waterSurface);

  // L-shaped arcade
  const createArcadeWing = (startX, startZ, length, rotation, numArches) => {
    const wingGroup = new THREE.Group();
    const archWidth = length / numArches;
    const arcadeHeight = 11;
    const bWall = new THREE.Mesh(new THREE.BoxGeometry(length + 4, arcadeHeight, 2), limestone);
    bWall.position.set(length / 2, arcadeHeight / 2, -4);
    wingGroup.add(bWall);
    for (let i = 0; i < numArches; i++) {
      const bayX = archWidth / 2 + i * archWidth;
      const openingWidth = archWidth - 1.8;
      const openingHeight = 8;
      const archVoid = new THREE.Mesh(new THREE.PlaneGeometry(openingWidth, openingHeight), windowDark);
      archVoid.position.set(bayX, openingHeight / 2 + 0.5, 0.1);
      wingGroup.add(archVoid);
      const archTopMesh = new THREE.Mesh(new THREE.CircleGeometry(openingWidth / 2, 24, 0, Math.PI), windowDark);
      archTopMesh.position.set(bayX, openingHeight + 0.5, 0.1);
      wingGroup.add(archTopMesh);
      if (i > 0) {
        const pilaster = new THREE.Mesh(new THREE.BoxGeometry(1.2, arcadeHeight, 0.6), limestoneLight);
        pilaster.position.set(i * archWidth, arcadeHeight / 2, 0);
        wingGroup.add(pilaster);
      }
    }
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(length + 4, 1, 1.5), limestoneDark);
    cornice.position.set(length / 2, arcadeHeight + 0.5, 0.25);
    wingGroup.add(cornice);
    wingGroup.rotation.y = rotation;
    wingGroup.position.set(startX, 0, startZ);
    scene.add(wingGroup);
  };
  createArcadeWing(-35, -18, 70, 0, 9);
  createArcadeWing(-35, -18, 35, Math.PI / 2, 4);
  createArcadeWing(35, -18, 35, -Math.PI / 2, 4);

  const palaceFacade = new THREE.Mesh(new THREE.BoxGeometry(85, 20, 3), limestone);
  palaceFacade.position.set(0, 24, -25);
  scene.add(palaceFacade);

  // Citrus trees
  let treeCounter = 0;
  const createCitrusTree = (x, z, scale = 1) => {
    treeCounter++;
    const id = `orangerie-tree-${treeCounter}`;
    const tree = new THREE.Group();
    const planterH = 1.1 * scale;
    const planterW = 1.3 * scale;
    const box = new THREE.Mesh(new THREE.BoxGeometry(planterW, planterH, planterW), planterGreen);
    box.position.y = planterH / 2 + 0.3;
    tree.add(box);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.14 * scale, 1.2 * scale, 8), new THREE.MeshStandardMaterial({ color: '#5a4a3a' }));
    trunk.position.y = planterH + 0.9 * scale;
    tree.add(trunk);
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.6 * scale, 16, 12), foliageLight);
    foliage.position.y = planterH + 2.4 * scale;
    tree.add(foliage);
    for (let i = 0; i < 8; i++) {
      const orange = new THREE.Mesh(new THREE.SphereGeometry(0.1 * scale, 6, 6), new THREE.MeshStandardMaterial({ color: '#e89030' }));
      const t = Math.random() * Math.PI * 2;
      const p = Math.random() * Math.PI * 0.6 + 0.2;
      orange.position.set(Math.sin(p) * Math.cos(t) * 1.3 * scale, planterH + 2.4 * scale + Math.cos(p) * 0.9 * scale, Math.sin(p) * Math.sin(t) * 1.3 * scale);
      tree.add(orange);
    }
    tree.position.set(x, 0, z);
    tree.userData.movable = true;
    tree.userData.furnitureId = id;
    tree.userData.originalPosition = tree.position.clone();
    tree.userData.originalRotationY = tree.rotation.y;
    if (movableObjectsRef) {
      movableObjectsRef.current.push(tree);
    }
    scene.add(tree);
  };
  for (let i = 0; i < 9; i++) createCitrusTree(-20 + i * 5, 12, 1);
  for (let i = 0; i < 11; i++) createCitrusTree(-25 + i * 5, 5, 0.95);
  for (let i = 0; i < 9; i++) createCitrusTree(-20 + i * 5, -2, 1);
  for (let i = 0; i < 11; i++) createCitrusTree(-25 + i * 5, -9, 0.9);

  const createCypress = (x, z, h = 10) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(1.0, h, 12), foliageDark);
    f.position.set(x, h / 2 + 0.6, z);
    scene.add(f);
  };
  createCypress(-15, 8, 11);
  createCypress(15, 8, 10);
  createCypress(-10, 1, 9);
  createCypress(10, 1, 9.5);
  createCypress(0, -5, 10);

  return camera;
}

import * as THREE from 'three';

export function createFrench(scene, width, height, clickableObjectsRef, movableObjectsRef) {
  scene.background = new THREE.Color('#1a1212');
  const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
  camera.position.set(-8, 4, 0);
  camera.lookAt(15, 5, 0);

  scene.add(new THREE.AmbientLight('#fffef8', 0.3));
  const theaterLight = new THREE.PointLight('#ffddaa', 1.2, 60);
  theaterLight.position.set(20, 8, 0);
  scene.add(theaterLight);
  const galleryLight1 = new THREE.PointLight('#fff8e0', 0.5, 15);
  galleryLight1.position.set(-10, 6, 0);
  scene.add(galleryLight1);
  const galleryLight2 = new THREE.PointLight('#fff8e0', 0.4, 12);
  galleryLight2.position.set(-8, 6, -6);
  scene.add(galleryLight2);

  const goldMat = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.7, roughness: 0.3 });
  const redVelvet = new THREE.MeshStandardMaterial({ color: '#7a2a3a', roughness: 0.9 });
  const creamMat = new THREE.MeshStandardMaterial({ color: '#f0e8d8', roughness: 0.7 });
  const wallCream = new THREE.MeshStandardMaterial({ color: '#e8e0d0', roughness: 0.8 });
  const darkWood = new THREE.MeshStandardMaterial({ color: '#3a2010', roughness: 0.6 });

  // Gallery floor
  const galleryFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 18),
    new THREE.MeshStandardMaterial({ color: '#b8956a', roughness: 0.6 })
  );
  galleryFloor.rotation.x = -Math.PI / 2;
  galleryFloor.position.set(-5, 0, 0);
  scene.add(galleryFloor);

  // Walls
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), wallCream);
  backWall.position.set(-15, 5, 0);
  backWall.rotation.y = Math.PI / 2;
  scene.add(backWall);
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallCream);
  leftWall.position.set(-5, 5, -9);
  scene.add(leftWall);
  const rightWallBack = new THREE.Mesh(new THREE.PlaneGeometry(8, 10), wallCream);
  rightWallBack.position.set(-11, 5, 9);
  rightWallBack.rotation.y = Math.PI;
  scene.add(rightWallBack);
  const galleryCeiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 18), wallCream);
  galleryCeiling.rotation.x = Math.PI / 2;
  galleryCeiling.position.set(-5, 10, 0);
  scene.add(galleryCeiling);

  // Clickable Moliere panel
  const moliereFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.2, 0.15), goldMat);
  moliereFrame.position.set(-3, 5, -8.92);
  scene.add(moliereFrame);

  const molierePanel = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.8, 0.2),
    new THREE.MeshStandardMaterial({ color: '#4a1a2a', roughness: 0.4, emissive: '#1a0a10', emissiveIntensity: 0.15 })
  );
  molierePanel.position.set(-3, 5, -8.85);
  molierePanel.userData = { panelId: 'moliere' };
  scene.add(molierePanel);
  clickableObjectsRef.current.push(molierePanel);

  const moliereTitle = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.4),
    new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.6, roughness: 0.3 })
  );
  moliereTitle.position.set(-3, 5.8, -8.82);
  moliereTitle.userData = { panelId: 'moliere' };
  scene.add(moliereTitle);
  clickableObjectsRef.current.push(moliereTitle);

  // Moliere portrait (base64 texture)
  const moliereImg = new Image();
  moliereImg.onload = () => {
    const tex = new THREE.Texture(moliereImg);
    tex.needsUpdate = true;
    const pw = 2, ph = pw * (moliereImg.height / moliereImg.width);
    const pFrame = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.3, ph + 0.3, 0.15), goldMat);
    pFrame.position.set(-6, 5, -8.92);
    scene.add(pFrame);
    const pCanvas = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ map: tex }));
    pCanvas.position.set(-6, 5, -8.82);
    scene.add(pCanvas);
  };
  moliereImg.src = 'data:image/jpeg;base64,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';

  // Gallery frames (decorative)
  const addFrame = (x, y, z, rotY, color) => {
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 2), goldMat);
    fr.position.set(x, y, z);
    fr.rotation.y = rotY;
    scene.add(fr);
    const canvas = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.1),
      new THREE.MeshStandardMaterial({ color, roughness: 0.5 })
    );
    canvas.position.set(x + (rotY === Math.PI / 2 ? 0.1 : 0), y, z);
    canvas.rotation.y = rotY;
    scene.add(canvas);
  };
  addFrame(-8, 5, -8.9, 0, '#3a2a3a');
  addFrame(-14.9, 5, 0, Math.PI / 2, '#3a2a2a');
  addFrame(-14.9, 5, 4, Math.PI / 2, '#2a2a3a');

  const addSmallFrame = (x, y, z, rotY, color) => {
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1), goldMat);
    fr.position.set(x, y, z);
    fr.rotation.y = rotY;
    scene.add(fr);
    const canvas = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.9),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
    );
    canvas.position.set(x + (rotY === Math.PI / 2 ? 0.08 : 0), y, z);
    canvas.rotation.y = rotY;
    scene.add(canvas);
  };
  addSmallFrame(-14.9, 3, -2, Math.PI / 2, '#5a4a3a');
  addSmallFrame(-14.9, 3, 6, Math.PI / 2, '#4a4a5a');
  addSmallFrame(-14.9, 7, -2, Math.PI / 2, '#3a4a4a');
  addSmallFrame(-14.9, 7, 2, Math.PI / 2, '#5a3a4a');
  addFrame(-2, 5, -8.9, 0, '#2a3a3a');

  // Bench
  const benchGroup = new THREE.Group();
  benchGroup.position.set(-10, 0, 0);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 1), redVelvet);
  bench.position.set(0, 0.6, 0);
  benchGroup.add(bench);
  const benchBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 1.2), darkWood);
  benchBase.position.set(0, 0.2, 0);
  benchGroup.add(benchBase);
  benchGroup.userData.movable = true;
  benchGroup.userData.furnitureId = 'french-bench';
  benchGroup.userData.originalPosition = benchGroup.position.clone();
  benchGroup.userData.originalRotationY = benchGroup.rotation.y;
  scene.add(benchGroup);
  if (movableObjectsRef) movableObjectsRef.current.push(benchGroup);

  // Gilded archway
  const archLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 10, 1), goldMat);
  archLeft.position.set(5, 5, -7);
  scene.add(archLeft);
  const archRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 10, 1), goldMat);
  archRight.position.set(5, 5, 7);
  scene.add(archRight);
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 15), goldMat);
  archTop.position.set(5, 9.5, 0);
  scene.add(archTop);

  // Theater floor
  const theaterFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 25),
    new THREE.MeshStandardMaterial({ color: '#7a2222', roughness: 0.8 })
  );
  theaterFloor.rotation.x = -Math.PI / 2;
  theaterFloor.position.set(20, 0, 0);
  scene.add(theaterFloor);

  const aisle = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 20),
    new THREE.MeshStandardMaterial({ color: '#aa3333', roughness: 0.7 })
  );
  aisle.rotation.x = -Math.PI / 2;
  aisle.position.set(15, 0.01, 0);
  scene.add(aisle);

  // Theater seats
  const seatMat = new THREE.MeshStandardMaterial({ color: '#5a1818', roughness: 0.8 });
  for (let row = 0; row < 6; row++) {
    for (let s = 0; s < 8; s++) {
      if (Math.abs(s - 3.5) < 0.6) continue;
      const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), seatMat);
      seatMesh.position.set(8 + row * 1.5, 0.25, (s - 3.5) * 1.2);
      scene.add(seatMesh);
      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.5), seatMat);
      seatBack.position.set(8 + row * 1.5 - 0.35, 0.6, (s - 3.5) * 1.2);
      scene.add(seatBack);
    }
  }

  // Balcony tiers
  for (let tier = 0; tier < 3; tier++) {
    const tierY = 3 + tier * 2.5;
    const tierDepth = 28 - tier * 1;
    const balconyFront = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 16), creamMat);
    balconyFront.position.set(tierDepth, tierY, 0);
    scene.add(balconyFront);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 16.2), goldMat);
    trim.position.set(tierDepth, tierY + 0.75, 0);
    scene.add(trim);
    for (let p = 0; p < 7; p++) {
      const pz = (p - 3) * 2.2;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 1.4), new THREE.MeshStandardMaterial({ color: '#e8dcc8' }));
      panel.position.set(tierDepth + 0.2, tierY, pz);
      scene.add(panel);
      const accent = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.4), goldMat);
      accent.position.set(tierDepth + 0.22, tierY, pz);
      scene.add(accent);
    }
  }

  const royalBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.5, 4), goldMat);
  royalBox.position.set(26, 9, 0);
  scene.add(royalBox);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 8), goldMat);
  crown.position.set(26, 10.8, 0);
  scene.add(crown);

  // Proscenium stage
  const stageX = 34;
  const stageWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), new THREE.MeshStandardMaterial({ color: '#1a0a0a', roughness: 0.95 }));
  stageWall.position.set(stageX + 1, 6, 0);
  stageWall.rotation.y = -Math.PI / 2;
  scene.add(stageWall);

  const stagePlatform = new THREE.Mesh(
    new THREE.BoxGeometry(6, 1.2, 14),
    new THREE.MeshStandardMaterial({ color: '#3a2010', roughness: 0.6 })
  );
  stagePlatform.position.set(stageX - 2, 0.6, 0);
  scene.add(stagePlatform);

  const stageFloorTop = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 14),
    new THREE.MeshStandardMaterial({ color: '#5a3a20', roughness: 0.4 })
  );
  stageFloorTop.rotation.x = -Math.PI / 2;
  stageFloorTop.rotation.z = Math.PI / 2;
  stageFloorTop.position.set(stageX - 2, 1.21, 0);
  scene.add(stageFloorTop);

  // Proscenium arch
  const proscLeft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 11, 1.5), goldMat);
  proscLeft.position.set(stageX - 4.5, 5.5, -7);
  scene.add(proscLeft);
  const proscRight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 11, 1.5), goldMat);
  proscRight.position.set(stageX - 4.5, 5.5, 7);
  scene.add(proscRight);
  const proscTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 15.5), goldMat);
  proscTop.position.set(stageX - 4.5, 11, 0);
  scene.add(proscTop);
  const proscCornice = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 16), goldMat);
  proscCornice.position.set(stageX - 4.5, 11.8, 0);
  scene.add(proscCornice);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(1, 1.5, 6), goldMat);
  crest.position.set(stageX - 4.5, 12.8, 0);
  scene.add(crest);

  // Curtains
  const curtainMat = new THREE.MeshStandardMaterial({ color: '#6a1515', roughness: 0.9 });
  const curtainGathered = new THREE.MeshStandardMaterial({ color: '#8a2020', roughness: 0.85 });

  const leftCurtainMain = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 3), curtainMat);
  leftCurtainMain.position.set(stageX - 3.5, 5.5, -5.5);
  scene.add(leftCurtainMain);
  const leftGather = new THREE.Mesh(new THREE.BoxGeometry(0.6, 10, 1.5), curtainGathered);
  leftGather.position.set(stageX - 3.2, 5.5, -6.5);
  scene.add(leftGather);
  const leftTie = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 8, 16, Math.PI), goldMat);
  leftTie.position.set(stageX - 3.3, 4, -5);
  leftTie.rotation.y = Math.PI / 2;
  leftTie.rotation.z = Math.PI / 2;
  scene.add(leftTie);

  const rightCurtainMain = new THREE.Mesh(new THREE.BoxGeometry(0.4, 10, 3), curtainMat);
  rightCurtainMain.position.set(stageX - 3.5, 5.5, 5.5);
  scene.add(rightCurtainMain);
  const rightGather = new THREE.Mesh(new THREE.BoxGeometry(0.6, 10, 1.5), curtainGathered);
  rightGather.position.set(stageX - 3.2, 5.5, 6.5);
  scene.add(rightGather);
  const rightTie = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 8, 16, Math.PI), goldMat);
  rightTie.position.set(stageX - 3.3, 4, 5);
  rightTie.rotation.y = Math.PI / 2;
  rightTie.rotation.z = -Math.PI / 2;
  scene.add(rightTie);

  // Valance
  const valance = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 12), curtainMat);
  valance.position.set(stageX - 4, 10.5, 0);
  scene.add(valance);
  for (let i = 0; i < 7; i++) {
    const scallop = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#7a1818', roughness: 0.8 })
    );
    scallop.position.set(stageX - 4, 9.8, -5.4 + i * 1.8);
    scallop.rotation.x = Math.PI;
    scene.add(scallop);
  }
  const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 12), goldMat);
  fringe.position.set(stageX - 4.1, 9.65, 0);
  scene.add(fringe);

  // Stage spotlights
  const stageSpot1 = new THREE.PointLight('#ffddaa', 0.8, 20);
  stageSpot1.position.set(stageX - 2, 10, -3);
  scene.add(stageSpot1);
  const stageSpot2 = new THREE.PointLight('#ffddaa', 0.8, 20);
  stageSpot2.position.set(stageX - 2, 10, 3);
  scene.add(stageSpot2);
  const footlightMat = new THREE.MeshBasicMaterial({ color: '#ffeecc' });
  for (let i = 0; i < 5; i++) {
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), footlightMat);
    fl.position.set(stageX - 4.8, 1.3, -3.2 + i * 1.6);
    scene.add(fl);
  }

  // Clickable Comedie panel on stage
  const comedieFrame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4.5, 6), goldMat);
  comedieFrame.position.set(stageX + 0.9, 5.5, 0);
  scene.add(comedieFrame);

  const comediePanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 4, 5.5),
    new THREE.MeshStandardMaterial({ color: '#5a1a1a', roughness: 0.7, emissive: '#2a0808', emissiveIntensity: 0.15 })
  );
  comediePanel.position.set(stageX + 0.95, 5.5, 0);
  comediePanel.userData = { panelId: 'comedie' };
  scene.add(comediePanel);
  clickableObjectsRef.current.push(comediePanel);

  // Theater ceiling
  const theaterCeiling = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 25),
    new THREE.MeshStandardMaterial({ color: '#e8dcd0', roughness: 0.7 })
  );
  theaterCeiling.rotation.x = Math.PI / 2;
  theaterCeiling.position.set(20, 12, 0);
  scene.add(theaterCeiling);

  [{ x: 18, z: -4 }, { x: 18, z: 4 }, { x: 24, z: 0 }].forEach(pos => {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: '#ffffdd' }));
    light.position.set(pos.x, 11, pos.z);
    scene.add(light);
    const pl = new THREE.PointLight('#ffeecc', 0.25, 10);
    pl.position.set(pos.x, 11, pos.z);
    scene.add(pl);
  });

  return camera;
}

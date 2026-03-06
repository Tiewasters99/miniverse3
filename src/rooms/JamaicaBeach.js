import * as THREE from 'three';
import { createSkyShader } from '../utils/geometries.js';

export function createJamaica(scene, width, height, clickableObjectsRef, movableObjectsRef) {
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 6, 35);
  camera.lookAt(0, 2, 5);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 32), createSkyShader('#1e90ff', '#87ceeb'));
  scene.add(sky);

  scene.add(new THREE.AmbientLight('#fff8f0', 0.6));
  const sun = new THREE.DirectionalLight('#fffae0', 1.0);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight('#87ceeb', '#f0e8d0', 0.4));

  const whiteSand = new THREE.MeshStandardMaterial({ color: '#faf8f0', roughness: 0.9 });
  const oceanDeep = new THREE.MeshStandardMaterial({ color: '#006994', roughness: 0.1, metalness: 0.3 });
  const oceanShallow = new THREE.MeshStandardMaterial({ color: '#40e0d0', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.9 });
  const foam = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 });

  const beach = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), whiteSand);
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(0, 0, 10);
  beach.receiveShadow = true;
  scene.add(beach);

  const shallowWater = new THREE.Mesh(new THREE.PlaneGeometry(200, 30), oceanShallow);
  shallowWater.rotation.x = -Math.PI / 2;
  shallowWater.position.set(0, -0.1, -25);
  scene.add(shallowWater);

  const deepOcean = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), oceanDeep);
  deepOcean.rotation.x = -Math.PI / 2;
  deepOcean.position.set(0, -0.3, -180);
  scene.add(deepOcean);

  const createWave = (z, w, intensity) => {
    const waveGroup = new THREE.Group();
    const crest = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, 2), foam);
    crest.position.set(0, 0.15 * intensity, 0);
    waveGroup.add(crest);
    for (let i = 0; i < 20; i++) {
      const foamBit = new THREE.Mesh(new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 6), foam);
      foamBit.position.set((Math.random() - 0.5) * w * 0.9, 0.1, (Math.random() - 0.5) * 3);
      foamBit.scale.y = 0.3;
      waveGroup.add(foamBit);
    }
    waveGroup.position.set(0, 0, z);
    scene.add(waveGroup);
  };
  createWave(-8, 180, 1.0);
  createWave(-18, 160, 0.8);
  createWave(-30, 140, 0.6);
  createWave(-45, 120, 0.5);
  createWave(-65, 100, 0.4);

  const shoreGradient = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 15),
    new THREE.MeshStandardMaterial({ color: '#e0f0f0', roughness: 0.5, transparent: true, opacity: 0.6 })
  );
  shoreGradient.rotation.x = -Math.PI / 2;
  shoreGradient.position.set(0, 0.02, -5);
  scene.add(shoreGradient);

  const wetSand = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 8),
    new THREE.MeshStandardMaterial({ color: '#d8d0c0', roughness: 0.6 })
  );
  wetSand.rotation.x = -Math.PI / 2;
  wetSand.position.set(0, 0.01, -2);
  scene.add(wetSand);

  const umbrellaColors = ['#e63946', '#f4a261', '#2a9d8f', '#e9c46a', '#f72585', '#4cc9f0'];
  const chairFabric = new THREE.MeshStandardMaterial({ color: '#f8f8f8', roughness: 0.8 });
  const woodLight = new THREE.MeshStandardMaterial({ color: '#c4a77d', roughness: 0.6 });

  const createBeachChair = (x, z, umbrellaColor, index) => {
    const chairGroup = new THREE.Group();
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 2), woodLight);
    fr.position.set(0, 0.35, 0);
    chairGroup.add(fr);
    const legGeo = new THREE.BoxGeometry(0.08, 0.35, 0.08);
    [[-0.3, 0.175, -0.8], [0.3, 0.175, -0.8], [-0.3, 0.175, 0.8], [0.3, 0.175, 0.8]].forEach(pos => {
      const leg = new THREE.Mesh(legGeo, woodLight);
      leg.position.set(...pos);
      chairGroup.add(leg);
    });
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.9), woodLight);
    backrest.position.set(0, 0.6, -0.7);
    backrest.rotation.x = -0.5;
    chairGroup.add(backrest);
    const seatFabric = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.8), chairFabric);
    seatFabric.rotation.x = -Math.PI / 2;
    seatFabric.position.set(0, 0.42, 0);
    chairGroup.add(seatFabric);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), woodLight);
    pole.position.set(0.6, 1.25, -0.3);
    chairGroup.add(pole);
    const umbrellaGeo = new THREE.ConeGeometry(1.2, 0.4, 8, 1, true);
    const umbrellaMat = new THREE.MeshStandardMaterial({ color: umbrellaColor, side: THREE.DoubleSide });
    const umbrella = new THREE.Mesh(umbrellaGeo, umbrellaMat);
    umbrella.position.set(0.6, 2.4, -0.3);
    umbrella.rotation.x = Math.PI;
    chairGroup.add(umbrella);
    chairGroup.position.set(x, 0, z);
    chairGroup.rotation.y = -0.2 + Math.random() * 0.4;
    scene.add(chairGroup);

    chairGroup.userData.movable = true;
    chairGroup.userData.furnitureId = `jamaica-chair-${index}`;
    chairGroup.userData.originalPosition = chairGroup.position.clone();
    chairGroup.userData.originalRotationY = chairGroup.rotation.y;
    if (movableObjectsRef) movableObjectsRef.current.push(chairGroup);
  };
  createBeachChair(-12, 2, umbrellaColors[0], 1);
  createBeachChair(-8, 1, umbrellaColors[1], 2);
  createBeachChair(-4, 2.5, umbrellaColors[2], 3);
  createBeachChair(4, 1.5, umbrellaColors[3], 4);
  createBeachChair(8, 2, umbrellaColors[4], 5);
  createBeachChair(12, 1, umbrellaColors[5], 6);

  const tinRoof = new THREE.MeshStandardMaterial({ color: '#7a8a8a', metalness: 0.6, roughness: 0.4 });
  const woodWall = new THREE.MeshStandardMaterial({ color: '#8b7355', roughness: 0.7 });

  const createStorefront = (x, z, sw, storeColor) => {
    const store = new THREE.Group();
    const walls = new THREE.Mesh(new THREE.BoxGeometry(sw, 3, 4), new THREE.MeshStandardMaterial({ color: storeColor, roughness: 0.8 }));
    walls.position.set(0, 1.5, 0);
    store.add(walls);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(sw + 1, 0.1, 5), tinRoof);
    roof.position.set(0, 3.2, 0.3);
    roof.rotation.x = 0.15;
    store.add(roof);
    const supportGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    [[-sw / 2 + 0.3, 2.8, 2.2], [sw / 2 - 0.3, 2.8, 2.2]].forEach(pos => {
      const support = new THREE.Mesh(supportGeo, woodWall);
      support.position.set(...pos);
      store.add(support);
    });
    const opening = new THREE.Mesh(new THREE.PlaneGeometry(sw - 1, 1.5), new THREE.MeshStandardMaterial({ color: '#2a2a2a' }));
    opening.position.set(0, 1.8, 2.01);
    store.add(opening);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(sw - 0.5, 0.15, 0.6), woodWall);
    counter.position.set(0, 1.1, 2.3);
    store.add(counter);
    store.position.set(x, 0, z);
    scene.add(store);
  };
  createStorefront(-15, 28, 6, '#e07050');
  createStorefront(0, 30, 7, '#50a0c0');
  createStorefront(15, 28, 6, '#e0c050');

  const tableMat = new THREE.MeshStandardMaterial({ color: '#f0e8d8', roughness: 0.6 });
  const chairMat = new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 0.7 });

  const createTableWithChairs = (x, z, index) => {
    const group = new THREE.Group();
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 16), tableMat);
    tableTop.position.set(0, 0.75, 0);
    group.add(tableTop);
    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.7, 8), chairMat);
    tableLeg.position.set(0, 0.35, 0);
    group.add(tableLeg);
    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.08, 12), chairMat);
    tableBase.position.set(0, 0.04, 0);
    group.add(tableBase);
    group.position.set(x, 0, z);
    scene.add(group);

    group.userData.movable = true;
    group.userData.furnitureId = `jamaica-table-${index}`;
    group.userData.originalPosition = group.position.clone();
    group.userData.originalRotationY = group.rotation.y;
    if (movableObjectsRef) movableObjectsRef.current.push(group);
  };
  createTableWithChairs(-17, 23, 1);
  createTableWithChairs(-13, 24, 2);
  createTableWithChairs(-3, 25, 3);
  createTableWithChairs(3, 25, 4);
  createTableWithChairs(13, 23, 5);
  createTableWithChairs(17, 24, 6);

  // Stage
  const stageGroup = new THREE.Group();
  const stagePlatform = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 7), new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 0.7 }));
  stagePlatform.position.set(0, 0.6, 0);
  stageGroup.add(stagePlatform);
  ['#009b3a', '#fed100', '#000000'].forEach((color, i) => {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(10.1, 0.35, 0.1), new THREE.MeshStandardMaterial({ color }));
    stripe.position.set(0, 1.0 - i * 0.35, 3.51);
    stageGroup.add(stripe);
  });
  const stageRoof = new THREE.Mesh(new THREE.BoxGeometry(12, 0.12, 8), new THREE.MeshStandardMaterial({ color: '#a05030', roughness: 0.4, metalness: 0.5 }));
  stageRoof.position.set(0, 4.5, 0);
  stageGroup.add(stageRoof);
  [[-5, 3], [5, 3], [-5, -3], [5, -3]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.3, 8), new THREE.MeshStandardMaterial({ color: '#3a2a1a', roughness: 0.6 }));
    post.position.set(px, 2.85, pz);
    stageGroup.add(post);
  });
  stageGroup.position.set(32, 0, 10);
  stageGroup.rotation.y = -0.4;
  scene.add(stageGroup);

  stageGroup.userData.movable = true;
  stageGroup.userData.furnitureId = 'jamaica-stage';
  stageGroup.userData.originalPosition = stageGroup.position.clone();
  stageGroup.userData.originalRotationY = stageGroup.rotation.y;
  if (movableObjectsRef) movableObjectsRef.current.push(stageGroup);

  // Boat
  const boatGroup = new THREE.Group();
  const bHull = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 8), new THREE.MeshStandardMaterial({ color: '#f8f8f8', roughness: 0.4 }));
  bHull.position.set(0, 0.4, 0);
  boatGroup.add(bHull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 7.5), new THREE.MeshStandardMaterial({ color: '#c49a6c', roughness: 0.6 }));
  deck.position.set(0, 1.05, 0);
  boatGroup.add(deck);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 3), new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.5 }));
  cabin.position.set(0, 1.85, -0.5);
  boatGroup.add(cabin);
  boatGroup.position.set(25, 0, -45);
  boatGroup.rotation.y = -0.3;
  scene.add(boatGroup);

  boatGroup.userData.movable = true;
  boatGroup.userData.furnitureId = 'jamaica-boat';
  boatGroup.userData.originalPosition = boatGroup.position.clone();
  boatGroup.userData.originalRotationY = boatGroup.rotation.y;
  if (movableObjectsRef) movableObjectsRef.current.push(boatGroup);

  return camera;
}

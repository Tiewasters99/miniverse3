import * as THREE from 'three';

export function createStudy(scene, width, height, clickableObjectsRef, movableObjectsRef) {
  scene.background = new THREE.Color('#3a3a4f');
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 3, 8);
  camera.lookAt(0, 2, 0);

  scene.add(new THREE.AmbientLight('#ffeedd', 0.7));
  const fireLight = new THREE.PointLight('#ff6622', 1.2, 15);
  fireLight.position.set(0, 1.5, -6);
  fireLight.name = 'fireLight';
  scene.add(fireLight);
  scene.add(new THREE.PointLight('#ffaa66', 0.8, 12).translateX(-4).translateY(3).translateZ(2));

  // Sunlight coming through the window
  const sunLight = new THREE.DirectionalLight('#ffe8c0', 0.6);
  sunLight.position.set(7, 8, 2);
  sunLight.target.position.set(0, 0, 2);
  scene.add(sunLight);
  scene.add(sunLight.target);

  const darkWood = new THREE.MeshStandardMaterial({ color: '#3a2a14', roughness: 0.7 });
  const richWood = new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: 0.6 });
  const wall = new THREE.MeshStandardMaterial({ color: '#4a4a5d', roughness: 0.9 });
  const leather = new THREE.MeshStandardMaterial({ color: '#6a4030', roughness: 0.5 });
  const gold = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.8, roughness: 0.3 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: '#3a3020' }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // === Rug (movable) ===
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ color: '#6a3040' }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.01, 1);
  rug.userData.movable = true;
  rug.userData.furnitureId = 'study-rug';
  rug.userData.originalPosition = rug.position.clone();
  rug.userData.originalRotationY = rug.rotation.y;
  scene.add(rug);
  if (movableObjectsRef) movableObjectsRef.current.push(rug);

  [['back', 0, 5, -7, 0], ['left', -7, 5, 0, Math.PI / 2], ['right', 7, 5, 0, -Math.PI / 2]].forEach(([, x, y, z, ry]) => {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), wall);
    w.position.set(x, y, z);
    w.rotation.y = ry;
    scene.add(w);
  });

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), wall);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 10;
  scene.add(ceiling);

  const mantel = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 0.8), richWood);
  mantel.position.set(0, 4, -6.5);
  scene.add(mantel);

  const fireOpening = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3), new THREE.MeshBasicMaterial({ color: '#0a0505' }));
  fireOpening.position.set(0, 1.5, -6.9);
  scene.add(fireOpening);

  const fireGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 1.5),
    new THREE.MeshBasicMaterial({ color: '#ff4400', transparent: true, opacity: 0.6 })
  );
  fireGlow.position.set(0, 0.8, -6.85);
  fireGlow.name = 'fireGlow';
  scene.add(fireGlow);

  // === Armchair (grouped, movable) ===
  const armchairGroup = new THREE.Group();
  armchairGroup.position.set(-2.5, 0, 2);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), leather);
  seat.position.set(0, 0.5, 0);
  armchairGroup.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.2), leather);
  back.position.set(0, 1.1, 0.5);
  armchairGroup.add(back);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 1.2), leather);
  armL.position.set(-0.55, 0.75, 0);
  armchairGroup.add(armL);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 1.2), leather);
  armR.position.set(0.55, 0.75, 0);
  armchairGroup.add(armR);

  armchairGroup.userData.movable = true;
  armchairGroup.userData.furnitureId = 'study-armchair';
  armchairGroup.userData.originalPosition = armchairGroup.position.clone();
  armchairGroup.userData.originalRotationY = armchairGroup.rotation.y;
  scene.add(armchairGroup);
  if (movableObjectsRef) movableObjectsRef.current.push(armchairGroup);

  // === Bookshelf (grouped, movable) ===
  const bookshelfGroup = new THREE.Group();
  bookshelfGroup.position.set(3.15, 0, -6.3);

  const shelfWood = new THREE.MeshStandardMaterial({ color: '#4a3018', roughness: 0.6 });
  const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.5, 2.8), shelfWood);
  shelfBack.position.set(0.25, 2.5, 0);
  bookshelfGroup.add(shelfBack);
  const shelfSideL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.5, 0.1), shelfWood);
  shelfSideL.position.set(0, 2.5, 1.35);
  bookshelfGroup.add(shelfSideL);
  const shelfSideR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.5, 0.1), shelfWood);
  shelfSideR.position.set(0, 2.5, -1.35);
  bookshelfGroup.add(shelfSideR);
  
  // Create 5 shelves at different heights
  const shelfYPositions = [];
  for (let s = 0; s < 5; s++) {
    const shelfY = 0.5 + s * 1.0;
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 2.7), shelfWood);
    shelf.position.set(0, shelfY, 0);
    bookshelfGroup.add(shelf);
    shelfYPositions.push(shelfY);
  }

  // Create books properly positioned on shelves
  const bookColors = ['#8B0000', '#2F4F4F', '#4A5568', '#7C3238', '#6B4423', '#1a3a5a', '#5a1a3a', '#2a4a2a'];
  
  // Only place books on the first 4 shelves (excluding the top shelf for visual variety)
  for (let shelfIndex = 0; shelfIndex < 4; shelfIndex++) {
    const shelfY = shelfYPositions[shelfIndex];
    const booksOnShelf = 5 + Math.floor(shelfIndex * 0.5); // Varying number of books per shelf
    
    // Calculate spacing for books along the shelf
    const shelfWidth = 2.4; // Available width for books (slightly less than full shelf width)
    const totalBookWidth = booksOnShelf * 0.18; // Approximate total width needed for all books
    const spacingBetweenBooks = (shelfWidth - totalBookWidth) / (booksOnShelf + 1);
    
    for (let bookIndex = 0; bookIndex < booksOnShelf; bookIndex++) {
      const bookHeight = 0.5 + Math.random() * 0.3;
      const bookWidth = 0.12 + Math.random() * 0.06;
      const bookDepth = 0.35;
      
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(bookDepth, bookHeight, bookWidth),
        new THREE.MeshStandardMaterial({ color: bookColors[(shelfIndex * 5 + bookIndex) % bookColors.length] })
      );
      
      // Position book properly on shelf surface
      const bookX = -0.15; // Position books toward the front of the shelf, against the back
      const bookY = shelfY + 0.04 + bookHeight / 2; // Shelf surface + small gap + half book height
      const bookZ = -1.2 + spacingBetweenBooks + bookIndex * (totalBookWidth / booksOnShelf + spacingBetweenBooks);
      
      book.position.set(bookX, bookY, bookZ);
      
      // Make each book individually clickable while maintaining their positioning
      book.userData.clickable = true;
      book.userData.bookId = `book-shelf${shelfIndex}-${bookIndex}`;
      
      bookshelfGroup.add(book);
      
      // Add books to clickable objects for potential interaction
      if (clickableObjectsRef && Math.random() < 0.3) { // Make some books clickable
        book.userData.panelId = 'book-detail';
        clickableObjectsRef.current.push(book);
      }
    }
  }

  bookshelfGroup.userData.movable = true;
  bookshelfGroup.userData.furnitureId = 'study-bookshelf';
  bookshelfGroup.userData.originalPosition = bookshelfGroup.position.clone();
  bookshelfGroup.userData.originalRotationY = bookshelfGroup.rotation.y;
  scene.add(bookshelfGroup);
  if (movableObjectsRef) movableObjectsRef.current.push(bookshelfGroup);

  // === Couch (already grouped, tag movable) ===
  const couchFabric = new THREE.MeshStandardMaterial({ color: '#3a4a5a', roughness: 0.8 });
  const couchAngle = Math.PI;
  const couchGroup = new THREE.Group();
  couchGroup.position.set(3, 0, 0);
  couchGroup.rotation.y = couchAngle;

  const couchSeat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 1.0), couchFabric);
  couchSeat.position.set(0, 0.45, 0);
  couchGroup.add(couchSeat);
  const couchBack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 0.35), couchFabric);
  couchBack.position.set(0, 0.95, 0.5);
  couchGroup.add(couchBack);
  const couchArmL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 1.0), couchFabric);
  couchArmL.position.set(-1.2, 0.65, 0);
  couchGroup.add(couchArmL);
  const couchArmR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 1.0), couchFabric);
  couchArmR.position.set(1.2, 0.65, 0);
  couchGroup.add(couchArmR);
  const pillowMat = new THREE.MeshStandardMaterial({ color: '#4a5a6a', roughness: 0.9 });
  const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.8), pillowMat);
  pillow1.position.set(-0.55, 0.7, -0.05);
  couchGroup.add(pillow1);
  const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.8), pillowMat);
  pillow2.position.set(0.55, 0.7, -0.05);
  couchGroup.add(pillow2);
  const legMat = new THREE.MeshStandardMaterial({ color: '#2a1a0a', roughness: 0.5 });
  [[-1.0, -0.35], [-1.0, 0.35], [1.0, -0.35], [1.0, 0.35]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 6), legMat);
    leg.position.set(lx, 0.14, lz);
    couchGroup.add(leg);
  });

  couchGroup.userData.movable = true;
  couchGroup.userData.furnitureId = 'study-couch';
  couchGroup.userData.originalPosition = couchGroup.position.clone();
  couchGroup.userData.originalRotationY = couchGroup.rotation.y;
  scene.add(couchGroup);
  if (movableObjectsRef) movableObjectsRef.current.push(couchGroup);

  // === Glass Coffee Table (grouped, movable) ===
  const glassTableGroup = new THREE.Group();
  glassTableGroup.position.set(0.25, 0, 1);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#88ccdd',
    transparent: true,
    opacity: 0.55,
    roughness: 0.05,
    metalness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
  const tableLegMat = new THREE.MeshStandardMaterial({ color: '#b0b0b0', metalness: 0.9, roughness: 0.15 });

  // Glass tabletop
  const glassTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.0), glassMat);
  glassTop.position.set(0, 0.5, 0);
  glassTableGroup.add(glassTop);

  // Thin edge trim to make the table more visible
  const edgeMat = new THREE.MeshStandardMaterial({ color: '#c0c0c0', metalness: 0.8, roughness: 0.2 });
  const edgeFront = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 0.02), edgeMat);
  edgeFront.position.set(0, 0.5, -0.5);
  glassTableGroup.add(edgeFront);
  const edgeBack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 0.02), edgeMat);
  edgeBack.position.set(0, 0.5, 0.5);
  glassTableGroup.add(edgeBack);
  const edgeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 1.0), edgeMat);
  edgeLeft.position.set(-0.9, 0.5, 0);
  glassTableGroup.add(edgeLeft);
  const edgeRight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 1.0), edgeMat);
  edgeRight.position.set(0.9, 0.5, 0);
  glassTableGroup.add(edgeRight);

  // Four slim metal legs
  [[-0.75, -0.4], [-0.75, 0.4], [0.75, -0.4], [0.75, 0.4]].forEach(([lx, lz]) => {
    const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), tableLegMat);
    tLeg.position.set(lx, 0.25, lz);
    glassTableGroup.add(tLeg);
  });

  // Small decorative item on top to help it read visually
  const coasterMat = new THREE.MeshStandardMaterial({ color: '#8B4513', roughness: 0.6 });
  const coaster = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 12), coasterMat);
  coaster.position.set(0.3, 0.55, 0);
  glassTableGroup.add(coaster);

  glassTableGroup.userData.movable = true;
  glassTableGroup.userData.furnitureId = 'study-glass-table';
  glassTableGroup.userData.originalPosition = glassTableGroup.position.clone();
  glassTableGroup.userData.originalRotationY = glassTableGroup.rotation.y;
  scene.add(glassTableGroup);
  if (movableObjectsRef) movableObjectsRef.current.push(glassTableGroup);

  // === Floor lamp (grouped, movable, contains clickable toggle) ===
  const lampGroup = new THREE.Group();
  lampGroup.position.set(4.8, 0, -1.2);

  const lampPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 4.0, 8),
    new THREE.MeshStandardMaterial({ color: '#b8962e', metalness: 0.7, roughness: 0.3 })
  );
  lampPole.position.set(0, 2.0, 0);
  lampGroup.add(lampPole);

  const lampBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.35, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: '#b8962e', metalness: 0.7, roughness: 0.3 })
  );
  lampBase.position.set(0, 0.05, 0);
  lampGroup.add(lampBase);

  const shadeMat = new THREE.MeshStandardMaterial({ color: '#f5e6c8', roughness: 0.8, side: THREE.DoubleSide });
  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.5, 0.6, 12, 1, true),
    shadeMat
  );
  lampShade.position.set(0, 4.1, 0);
  lampGroup.add(lampShade);

  const glowMat = new THREE.MeshBasicMaterial({ color: '#ffe4a0', transparent: true, opacity: 0.6 });
  const lampGlow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), glowMat);
  lampGlow.position.set(0, 3.9, 0);
  lampGroup.add(lampGlow);

  const lampLight = new THREE.PointLight('#ffe0a0', 0.8, 8);
  lampLight.position.set(0, 3.9, 0);
  lampLight.name = 'lampLight';
  lampGroup.add(lampLight);

  const lampClickArea = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 1.2, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  lampClickArea.position.set(0, 4.0, 0);
  lampClickArea.userData.lampToggle = true;
  lampClickArea.userData.light = lampLight;
  lampClickArea.userData.glowMesh = lampGlow;
  lampGroup.add(lampClickArea);
  if (clickableObjectsRef) clickableObjectsRef.current.push(lampClickArea);

  lampGroup.userData.movable = true;
  lampGroup.userData.furnitureId = 'study-lamp';
  lampGroup.userData.originalPosition = lampGroup.position.clone();
  lampGroup.userData.originalRotationY = lampGroup.rotation.y;
  scene.add(lampGroup);
  if (movableObjectsRef) movableObjectsRef.current.push(lampGroup);

  const portraitFrame = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 0.15), gold);
  portraitFrame.position.set(0, 6, -6.85);
  scene.add(portraitFrame);

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.5, 2), richWood);
  doorFrame.position.set(-6.9, 1.75, 2);
  scene.add(doorFrame);

  const doorPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.2), new THREE.MeshStandardMaterial({ color: '#3a2a1a' }));
  doorPanel.position.set(-6.88, 1.75, 2);
  doorPanel.rotation.y = Math.PI / 2;
  scene.add(doorPanel);

  const doorWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), new THREE.MeshBasicMaterial({ color: '#40e0d0', transparent: true, opacity: 0.4 }));
  doorWindow.position.set(-6.86, 2.2, 2);
  doorWindow.rotation.y = Math.PI / 2;
  scene.add(doorWindow);

  const doorHandle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), gold);
  doorHandle.position.set(-6.82, 1.5, 2.6);
  scene.add(doorHandle);

  // === Clickable research panels (grouped, clickable AND movable) ===
  const panelMat = new THREE.MeshStandardMaterial({ color: '#2a3a4a', roughness: 0.6 });
  const panelBorder = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.6, roughness: 0.4 });

  // === Dictionaries Panel (clickable + movable group) ===
  const dictGroup = new THREE.Group();
  dictGroup.position.set(-4.2, 6.0, -6.91);

  const dictBorder = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.08), panelBorder);
  dictBorder.position.set(0, 0, 0);
  dictGroup.add(dictBorder);
  const dictPanel = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.9), panelMat);
  dictPanel.position.set(0, 0, 0.03);
  dictPanel.userData.panelId = 'dictionaries';
  dictGroup.add(dictPanel);
  if (clickableObjectsRef) clickableObjectsRef.current.push(dictPanel);

  const dictLabel = createPanelLabel('Dictionaries &\\nLanguage Resources', '📚');
  dictLabel.position.set(0, 0, 0.05);
  dictLabel.raycast = () => {}; // Make label transparent to raycasting so clicks reach the panel behind
  dictGroup.add(dictLabel);

  dictGroup.userData.movable = true;
  dictGroup.userData.furnitureId = 'study-dict-panel';
  dictGroup.userData.originalPosition = dictGroup.position.clone();
  dictGroup.userData.originalRotationY = dictGroup.rotation.y;
  scene.add(dictGroup);
  if (movableObjectsRef) movableObjectsRef.current.push(dictGroup);

  // === Legal Resources Panel (clickable + movable group) ===
  const legalGroup = new THREE.Group();
  legalGroup.position.set(-4.2, 3.5, -6.91);

  const legalBorder = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.08), panelBorder);
  legalBorder.position.set(0, 0, 0);
  legalGroup.add(legalBorder);
  const legalPanel = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.9), panelMat);
  legalPanel.position.set(0, 0, 0.03);
  legalPanel.userData.panelId = 'legalresources';
  legalGroup.add(legalPanel);
  if (clickableObjectsRef) clickableObjectsRef.current.push(legalPanel);

  const legalLabel = createPanelLabel('Online Legal\\nResources', '⚖️');
  legalLabel.position.set(0, 0, 0.05);
  legalLabel.raycast = () => {}; // Make label transparent to raycasting so clicks reach the panel behind
  legalGroup.add(legalLabel);

  legalGroup.userData.movable = true;
  legalGroup.userData.furnitureId = 'study-legal-panel';
  legalGroup.userData.originalPosition = legalGroup.position.clone();
  legalGroup.userData.originalRotationY = legalGroup.rotation.y;
  scene.add(legalGroup);
  if (movableObjectsRef) movableObjectsRef.current.push(legalGroup);

  // === Video Links Panel on left wall (clickable + movable group) ===
  const videoGroup = new THREE.Group();
  videoGroup.position.set(-6.91, 6.0, -3);
  videoGroup.rotation.y = Math.PI / 2;

  const videoBorder = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.08), panelBorder);
  videoBorder.position.set(0, 0, 0);
  videoGroup.add(videoBorder);
  const videoPanel = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.9), panelMat);
  videoPanel.position.set(0, 0, 0.03);
  videoPanel.userData.panelId = 'videolinks';
  videoGroup.add(videoPanel);
  if (clickableObjectsRef) clickableObjectsRef.current.push(videoPanel);

  const videoLabel = createPanelLabel('Video Links', '🎥');
  videoLabel.position.set(0, 0, 0.05);
  videoLabel.raycast = () => {}; // Make label transparent to raycasting so clicks reach the panel behind
  videoGroup.add(videoLabel);

  videoGroup.userData.movable = true;
  videoGroup.userData.furnitureId = 'study-video-panel';
  videoGroup.userData.originalPosition = videoGroup.position.clone();
  videoGroup.userData.originalRotationY = videoGroup.rotation.y;
  scene.add(videoGroup);
  if (movableObjectsRef) movableObjectsRef.current.push(videoGroup);

  // === Window on right wall with garden view ===
  const windowFrameMat = new THREE.MeshStandardMaterial({ color: '#f0e8d8', roughness: 0.5 });

  const skyBlue = new THREE.MeshBasicMaterial({ color: '#87CEEB' });
  const windowSky = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.5), skyBlue);
  windowSky.position.set(6.95, 4.5, -1);
  windowSky.rotation.y = -Math.PI / 2;
  scene.add(windowSky);

  const cloudMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 });
  [[-0.8, 1.2, 0.6], [0.5, 0.9, 0.45], [0.1, 1.4, 0.35]].forEach(([oz, oy, s]) => {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), cloudMat);
    cloud.scale.set(1.5, 0.6, 1);
    cloud.position.set(7.6, 4.0 + oy, -1 + oz);
    scene.add(cloud);
  });

  const gardenGround = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 1.2),
    new THREE.MeshBasicMaterial({ color: '#4a8c3f' })
  );
  gardenGround.position.set(6.94, 3.1, -1);
  gardenGround.rotation.y = -Math.PI / 2;
  scene.add(gardenGround);

  const gardenPath = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 1.2),
    new THREE.MeshBasicMaterial({ color: '#c4a97d' })
  );
  gardenPath.position.set(6.93, 3.1, -1);
  gardenPath.rotation.y = -Math.PI / 2;
  scene.add(gardenPath);

  const flowerColors = ['#e84393', '#fd79a8', '#ff6b6b', '#feca57', '#ff9ff3', '#f368e0', '#ee5a24', '#fad390'];
  const bushPositions = [
    [-1.0, 3.4], [-0.5, 3.3], [0.0, 3.5], [0.5, 3.3], [1.0, 3.4],
    [-0.7, 3.6], [0.3, 3.7], [0.8, 3.5],
  ];
  bushPositions.forEach(([oz, oy], i) => {
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 6, 6),
      new THREE.MeshBasicMaterial({ color: '#2d8a4e' })
    );
    bush.scale.set(1.3, 0.9, 1);
    bush.position.set(6.92, oy, -1 + oz);
    scene.add(bush);

    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 6, 6),
      new THREE.MeshBasicMaterial({ color: flowerColors[i % flowerColors.length] })
    );
    flower.position.set(6.90, oy + 0.12, -1 + oz + 0.05);
    scene.add(flower);

    const flower2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshBasicMaterial({ color: flowerColors[(i + 3) % flowerColors.length] })
    );
    flower2.position.set(6.90, oy + 0.05, -1 + oz - 0.08);
    scene.add(flower2);
  });

  [[-1.1, 4.3], [0.6, 4.4], [1.2, 4.2]].forEach(([oz, oy]) => {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.5, 6),
      new THREE.MeshBasicMaterial({ color: '#5a3e28' })
    );
    trunk.position.set(7.3, oy, -1 + oz);
    scene.add(trunk);
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 6, 6),
      new THREE.MeshBasicMaterial({ color: '#2e7d32' })
    );
    canopy.position.set(7.3, oy + 0.35, -1 + oz);
    scene.add(canopy);
  });

  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 3.3), windowFrameMat);
  frameTop.position.set(6.89, 6.35, -1);
  scene.add(frameTop);
  const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 3.3), windowFrameMat);
  frameBottom.position.set(6.89, 2.6, -1);
  scene.add(frameBottom);
  const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.9, 0.18), windowFrameMat);
  frameLeft.position.set(6.89, 4.5, -2.55);
  scene.add(frameLeft);
  const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.9, 0.18), windowFrameMat);
  frameRight.position.set(6.89, 4.5, 0.55);
  scene.add(frameRight);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.7, 0.08), windowFrameMat);
  crossV.position.set(6.88, 4.5, -1);
  scene.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 3.1), windowFrameMat);
  crossH.position.set(6.88, 4.5, -1);
  scene.add(crossH);

  const sill = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 3.5), windowFrameMat);
  sill.position.set(6.8, 2.55, -1);
  scene.add(sill);

  return camera;
}

// Helper: creates a canvas-texture label sprite for a wall panel
function createPanelLabel(text, icon) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#2a3a4a';
  ctx.fillRect(0, 0, 512, 400);

  ctx.fillStyle = '#d4af37';
  ctx.font = '64px serif';
  ctx.textAlign = 'center';
  ctx.fillText(icon, 256, 80);

  ctx.fillStyle = '#e8e0d0';
  ctx.font = 'bold 36px Georgia, serif';
  const lines = text.split('\\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, 256, 160 + i * 50);
  });

  ctx.fillStyle = '#888';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('click to open', 256, 320);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), mat);
  return mesh;
}

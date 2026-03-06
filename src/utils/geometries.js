import * as THREE from 'three';

export function buildTextMesh(wt, idx) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, 512, 256);
  ctx.font = `${Math.min(wt.size * 2, 120)}px ${wt.font}`;
  ctx.fillStyle = wt.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = wt.text.split(' ');
  const lines = [];
  let line = '';
  words.forEach(w => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > 470) { lines.push(line); line = w; }
    else { line = test; }
  });
  if (line) lines.push(line);
  const lineHeight = Math.min(wt.size * 2, 120) * 1.3;
  const startY = 128 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, 256, startY + i * lineHeight));
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(wt.w || 4, wt.h || 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  plane.position.set(wt.x, wt.y, wt.z);
  if (wt.rotY) plane.rotation.y = wt.rotY;
  plane.renderOrder = 1;
  plane.userData = { wallTextIndex: idx };
  return plane;
}

export function createSkyShader(topColor, horizonColor) {
  return new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(topColor) },
      horizonColor: { value: new THREE.Color(horizonColor) },
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
        float blend = pow(max(h, 0.0), 0.4);
        gl_FragColor = vec4(mix(horizonColor, topColor, blend), 1.0);
      }
    `,
    side: THREE.BackSide,
  });
}

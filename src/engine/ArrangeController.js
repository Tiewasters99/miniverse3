import * as THREE from 'three';

const STORAGE_PREFIX = 'miniverse:furniture-layout:';

export default class ArrangeController {
  constructor(scene, camera, domElement, movableObjectsRef, currentRoom, roomBounds) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.movableObjectsRef = movableObjectsRef;
    this.currentRoom = currentRoom;
    this.roomBounds = roomBounds;

    this.selected = null;
    this.boxHelper = null;
    this.isDragging = false;
    this.dragOffset = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.intersectPoint = new THREE.Vector3();
  }

  // Find the top-level movable ancestor of a hit object
  _findMovableAncestor(object) {
    let current = object;
    while (current) {
      if (current.userData && current.userData.movable) return current;
      current = current.parent;
    }
    return null;
  }

  // Get all meshes inside movable objects (for raycasting)
  _getMovableMeshes() {
    const meshes = [];
    const movables = this.movableObjectsRef.current || [];
    movables.forEach(obj => {
      obj.traverse(child => {
        if (child.isMesh) meshes.push(child);
      });
    });
    return meshes;
  }

  _updateMouse(clientX, clientY) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  select(object) {
    this.deselect();
    this.selected = object;
    this.boxHelper = new THREE.BoxHelper(object, 0xd4af37);
    this.scene.add(this.boxHelper);
  }

  deselect() {
    if (this.boxHelper) {
      this.scene.remove(this.boxHelper);
      this.boxHelper.dispose();
      this.boxHelper = null;
    }
    this.selected = null;
    this.isDragging = false;
  }

  // Returns true if the click was handled (hit a movable or deselected)
  handlePointerDown(clientX, clientY) {
    this._updateMouse(clientX, clientY);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = this._getMovableMeshes();
    const hits = this.raycaster.intersectObjects(meshes);

    if (hits.length > 0) {
      const movable = this._findMovableAncestor(hits[0].object);
      if (movable) {
        if (this.selected !== movable) {
          this.select(movable);
        }
        // Start drag: calculate offset between floor intersection and object position
        this.raycaster.ray.intersectPlane(this.floorPlane, this.intersectPoint);
        this.dragOffset.copy(movable.position).sub(this.intersectPoint);
        this.isDragging = true;
        return 'select';
      }
    }

    // Clicked empty space — deselect
    if (this.selected) {
      this.deselect();
      return 'deselect';
    }
    return false;
  }

  handlePointerMove(clientX, clientY) {
    if (!this.isDragging || !this.selected) return false;

    this._updateMouse(clientX, clientY);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.raycaster.ray.intersectPlane(this.floorPlane, this.intersectPoint);

    let newX = this.intersectPoint.x + this.dragOffset.x;
    let newZ = this.intersectPoint.z + this.dragOffset.z;

    // Clamp to room bounds
    if (this.roomBounds) {
      newX = Math.max(this.roomBounds.minX, Math.min(this.roomBounds.maxX, newX));
      newZ = Math.max(this.roomBounds.minZ, Math.min(this.roomBounds.maxZ, newZ));
    }

    this.selected.position.x = newX;
    this.selected.position.z = newZ;
    return true;
  }

  handlePointerUp() {
    if (this.isDragging && this.selected) {
      this.isDragging = false;
      this.saveLayout();
      return true;
    }
    this.isDragging = false;
    return false;
  }

  rotate(delta) {
    if (!this.selected) return;
    this.selected.rotation.y += delta;
    this.saveLayout();
  }

  setHeight(value) {
    if (!this.selected) return;
    this.selected.position.y = value;
    this.saveLayout();
  }

  update() {
    if (this.boxHelper && this.selected) {
      this.boxHelper.update();
    }
  }

  // Save all movable object positions to localStorage
  saveLayout() {
    const movables = this.movableObjectsRef.current || [];
    const data = {};
    movables.forEach(obj => {
      const id = obj.userData.furnitureId;
      if (!id) return;
      data[id] = {
        x: obj.position.x,
        y: obj.position.y,
        z: obj.position.z,
        ry: obj.rotation.y,
      };
    });
    try {
      localStorage.setItem(STORAGE_PREFIX + this.currentRoom, JSON.stringify(data));
    } catch (e) { /* quota exceeded, ignore */ }
  }

  // Static: load saved layout and apply to movable objects
  static loadLayout(currentRoom, movableObjectsRef) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + currentRoom);
      if (!raw) return;
      const data = JSON.parse(raw);
      const movables = movableObjectsRef.current || [];
      movables.forEach(obj => {
        const id = obj.userData.furnitureId;
        if (!id || !data[id]) return;
        obj.position.set(data[id].x, data[id].y, data[id].z);
        obj.rotation.y = data[id].ry;
      });
    } catch (e) { /* parse error, ignore */ }
  }

  // Reset a single object to its original position
  static resetObject(obj) {
    if (!obj) return;
    if (obj.userData.originalPosition) {
      obj.position.copy(obj.userData.originalPosition);
    }
    if (obj.userData.originalRotationY !== undefined) {
      obj.rotation.y = obj.userData.originalRotationY;
    }
  }

  // Reset all movable objects and clear saved layout
  static resetAll(currentRoom, movableObjectsRef) {
    const movables = movableObjectsRef.current || [];
    movables.forEach(obj => ArrangeController.resetObject(obj));
    try {
      localStorage.removeItem(STORAGE_PREFIX + currentRoom);
    } catch (e) { /* ignore */ }
  }

  dispose() {
    this.deselect();
  }
}

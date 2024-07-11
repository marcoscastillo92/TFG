import * as THREE from 'three';

class RoadFactory {
	static createRoad(textureSelected) {
		const geometry = new THREE.BoxGeometry(1, 0.1, 1);
		const texture = new THREE.TextureLoader().load(
			`/src/textures/${textureSelected}.jpg`
		);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(1, 1);
		const material = new THREE.MeshBasicMaterial({ map: texture });
		const road = new THREE.Mesh(geometry, material);
		road.position.set(0, 0, 0);
		road.isDraggable = true;
		road.name = textureSelected;
		road.customType = 'Road';
		return road;
	}
}

export default RoadFactory;

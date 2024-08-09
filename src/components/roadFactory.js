import * as THREE from 'three';

function getRoad(textureSelected) {
	const geometry = new THREE.BoxGeometry(1, 0.1, 1);
	const texture = new THREE.TextureLoader().load(
		`/assets/textures/${textureSelected}.jpg`
	);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(1, 1);
	texture.colorSpace = THREE.SRGBColorSpace;
	const material = new THREE.MeshBasicMaterial({ map: texture });
	const road = new THREE.Mesh(geometry, material);
	road.position.set(0, 0, 0);
	road.isDraggable = true;
	road.name = textureSelected;
	road.customType = 'Road';
	return road;
}

function getRoundabout(textureSelected) {
	const texture = new THREE.TextureLoader().load(
		`/assets/textures/${textureSelected}.jpg`
	);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(5, 5);
	texture.colorSpace = THREE.SRGBColorSpace;
	const material = new THREE.MeshBasicMaterial({
		map: texture
	});
	const cylinderMesh1 = new THREE.Mesh(
		new THREE.CylinderGeometry(3, 3, 1.02, 30, 1, false),
		material
	);
	const cylinderMesh2 = new THREE.Mesh(
		new THREE.CylinderGeometry(1, 1, 1.25, 30, 1, false),
		new THREE.MeshBasicMaterial({ color: 'green' })
	);
	const roundabout = new THREE.Group();
	roundabout.add(cylinderMesh1);
	roundabout.add(cylinderMesh2);
	roundabout.position.set(0, -0.45, 0);
	roundabout.isDraggable = true;
	roundabout.name = 'roundabout';
	roundabout.customType = 'Roundabout';
	return roundabout;
}

class RoadFactory {
	static createRoad(textureSelected) {
		if (textureSelected === 'roundabout') {
			return getRoundabout(textureSelected);
		}
		return getRoad(textureSelected);
	}
}

export default RoadFactory;

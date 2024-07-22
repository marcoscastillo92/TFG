import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();
const cubeYSize = 2.8;

function getGeometrySizeByType(type) {
	switch (type) {
		case 'Tree':
			return new THREE.Vector3(1, cubeYSize, 1);
		default:
			return new THREE.Vector3(1, 1, 1);
	}
}

function getScaleByType(type) {
	switch (type) {
		case 'Tree':
			return new THREE.Vector3(0.06, 0.06, 0.06);
		default:
			return new THREE.Vector3(1, 1, 1);
	}
}

function getBoxPositionByType(type) {
	const scale = getGeometrySizeByType(type);
	return new THREE.Vector3(0, scale.y / 2, 0);
}

function getPositionByType(type) {
	const position = getBoxPositionByType(type);
	return new THREE.Vector3(0, position.y / 2, 0);
}

class EnvironmentFactory {
	static async createObject(key) {
		const gltf = await gltfLoader.loadAsync(
			`/src/models/environment/${key}/${key}.gltf`
		);
		const objectNode = gltf.scene.getObjectByName('RootNode');
		const position = getPositionByType(key);
		objectNode.position.set(position.x, -position.y, position.z);
		const scale = getScaleByType(key);
		objectNode.scale.set(scale.x, scale.y, scale.z);
		const geometrySize = getGeometrySizeByType(key);
		const cubeGeometry = new THREE.BoxGeometry(
			geometrySize.x,
			geometrySize.y,
			geometrySize.z
		);
		const cubeMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			opacity: 0.0
		});
		cubeMaterial.transparent = true;
		const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		cube.isTransparent = true;
		cube.isEnvironment = true;
		cube.isDraggable = true;
		const cubePosition = getBoxPositionByType(key);
		cube.position.set(cubePosition.x, cubePosition.y, cubePosition.z);
		cube.name = key;
		cube.customType = 'Environment';
		cube.add(objectNode);
		return cube;
	}
}

export default EnvironmentFactory;

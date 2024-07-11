import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import dumpObject from '../helpers/dumpObject.js';
import * as THREE from 'three';

const gltfLoader = new GLTFLoader();

function getScaleByType(type) {
	switch (type) {
		case 'ElectricScooter':
			return 1;
		case 'Bicycle':
			return 0.07;
		case 'Motorbike':
			return 2;
		default:
			return 0.25;
	}
}

function getBoxScaleByType(type) {
	switch (type) {
		case 'Bus':
		case 'TruckTrailer':
			return new THREE.Vector3(1, 1.2, 3.5);
		case 'ElectricScooter':
		case 'Bicycle':
		case 'Motorbike':
			return new THREE.Vector3(0.5, 0.5, 0.7);
		case 'Ambulance':
			return new THREE.Vector3(1, 0.8, 1.7);
		default:
			return new THREE.Vector3(1, 0.7, 1.4);
	}
}

function getBoxGeometryByType(type) {
	const scale = getBoxScaleByType(type);
	return new THREE.BoxGeometry(scale.x, scale.y, scale.z);
}

function getRotationByType(type) {
	switch (type) {
		case 'ElectricScooter':
			return new THREE.Vector3(0, Math.PI / 2, 0);
		case 'Bicycle':
		case 'Motorbike':
			return new THREE.Vector3(0, -Math.PI / 2, 0);
		default:
			return new THREE.Vector3(0, 0, 0);
	}
}

function getBoxPositionByType(type) {
	const scale = getBoxScaleByType(type);
	return new THREE.Vector3(0, scale.y / 2, 0);
}

class VehicleFactory {
	static async createVehicle(vehicle) {
		const gltf = await gltfLoader.loadAsync(
			`/src/models/vehicles/${vehicle}/${vehicle}.gltf`
		);
		const vehicleNode = gltf.scene.getObjectByName('RootNode');
		console.log(dumpObject(vehicleNode).join('\n'));
		const cubePosition = getBoxPositionByType(vehicle);

		vehicleNode.position.set(0, -cubePosition.y, 0);

		const scale = getScaleByType(vehicle);
		vehicleNode.scale.set(scale, scale, scale);

		const rotation = getRotationByType(vehicle);
		vehicleNode.rotation.set(rotation.x, rotation.y, rotation.z);

		const cubeGeometry = getBoxGeometryByType(vehicle);
		const cubeMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			opacity: 0.0
		});
		cubeMaterial.transparent = true;
		const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		cube.name = vehicle;
		cube.isVehicle = true;
		cube.isTransparent = true;
		cube.isDraggable = true;
		cube.customType = 'Vehicle';
		cube.vehicleColor = '';
		cube.position.set(cubePosition.x, cubePosition.y, cubePosition.z);
		cube.add(vehicleNode);
		return cube;
	}
}

export default VehicleFactory;

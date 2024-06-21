import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import dumpObject from '../helpers/dumpObject.js';
import * as THREE from 'three';

const gltfLoader = new GLTFLoader();

class VehicleFactory {
	static async createVehicle(vehicle) {
		const gltf = await gltfLoader.loadAsync(
			`/src/models/vehicles/${vehicle}/${vehicle}.gltf`
		);
		const vehicleNode = gltf.scene.getObjectByName('RootNode');
		// console.log(dumpObject(vehicleNode).join('\n'));
		vehicleNode.isVehicle = true;
		vehicleNode.isDraggable = true;
		vehicleNode.position.set(0, -0.5, 0);
		const scale = vehicle === 'ElectricScooter' ? 1.6 : 0.25;
		vehicleNode.scale.set(scale, scale, scale);
		const boxScale =
			vehicle === 'Bus'
				? new THREE.Vector3(1, 1.2, 4)
				: vehicle === 'ElectricScooter'
				? new THREE.Vector3(1, 1, 1)
				: new THREE.Vector3(1, 1, 2);
		const cubeGeometry = new THREE.BoxGeometry(
			boxScale.x,
			boxScale.y,
			boxScale.z
		);
		const cubeMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			opacity: 0.0
		});
		cubeMaterial.transparent = true;
		const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		cube.isVehicle = true;
		cube.isDraggable = true;
		cube.position.set(0, 0.5, 0);
		cube.add(vehicleNode);
		return cube;
	}
}

export default VehicleFactory;

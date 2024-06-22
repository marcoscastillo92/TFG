import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();

class PeopleFactory {
	static async createPeople(people) {
		const gltf = await gltfLoader.loadAsync(
			`/src/models/people/${people}/${people}.gltf`
		);
		const peopleNode = gltf.scene.getObjectByName('RootNode');
		peopleNode.position.set(0, -0.3, 0);
		peopleNode.scale.set(0.3, 0.3, 0.3);
		const cubeGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.5);
		const cubeMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			opacity: 0.0
		});
		cubeMaterial.transparent = true;
		const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		cube.isPeople = true;
		cube.isTransparent = true;
		cube.isDraggable = true;
		cube.position.set(0, 0.3, 0);
		cube.add(peopleNode);
		return cube;
	}
}

export default PeopleFactory;

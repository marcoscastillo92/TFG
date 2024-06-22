import * as THREE from 'three';

export function initScene(scene) {
	const geometry = new THREE.PlaneGeometry(20, 20);
	const texture = new THREE.TextureLoader().load('/src/textures/concrete.jpg');
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(10, 10);
	const material = new THREE.MeshBasicMaterial({ map: texture });
	const plane = new THREE.Mesh(geometry, material);
	plane.rotation.x = -Math.PI / 2;
	plane.position.set(0, -0.01, 0);
	plane.name = 'ground';
	scene.add(plane);
}

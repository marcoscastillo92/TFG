import * as THREE from 'three';

class SignFactory {
	static createSign(filename) {
		const geometry = new THREE.CylinderGeometry(1, 1, 0.1);
		const texture = new THREE.TextureLoader().load(`/src/textures/${filename}`);
		geometry.lookAt(new THREE.Vector3(0, 1, 0));
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.flipY = false;
		texture.center.set(0.5, 0.5);
		texture.rotation = -(90 * Math.PI) / 180;
		const material = new THREE.MeshBasicMaterial({
			map: texture
		});
		const sign = new THREE.Mesh(geometry, material);
		sign.position.set(0, 0.75, 0);
		sign.scale.set(0.25, 0.25, 0.25);
		const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2);
		const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
		const pole = new THREE.Mesh(poleGeometry, poleMaterial);
		pole.position.set(0, -2, 0);
		sign.add(pole);
		const cubeGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
		const cubeMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			opacity: 0.0
		});
		cubeMaterial.transparent = true;
		const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		cube.isTransparent = true;
		cube.isDraggable = true;
		cube.customType = 'Sign';
		cube.name = filename;
		cube.add(sign);
		return cube;
	}
}

export default SignFactory;

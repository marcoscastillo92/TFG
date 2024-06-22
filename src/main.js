import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import addListeners from './helpers/addListeners.js';
import { initScene } from './helpers/scene.js';

const width = window.innerWidth * 0.8;
const height = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const light = new THREE.AmbientLight(0xffffff, 1);
const controls = new OrbitControls(camera, renderer.domElement);

scene.add(gridHelper);
renderer.setSize(width, height);
document.querySelector('.canvas').appendChild(renderer.domElement);
scene.add(light);
camera.position.set(0, 5, 10);

window.addEventListener('resize', () => {
	camera.updateProjectionMatrix();
	renderer.setSize(width, height);
});

addListeners(scene, camera, gridHelper);
initScene(scene);

const animate = function () {
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
};

if (WebGL.isWebGLAvailable()) {
	animate();
} else {
	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById('container').appendChild(warning);
}

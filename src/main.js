import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import addListeners from './helpers/addListeners.js';
import { initScene } from './helpers/scene.js';

let width = window.innerWidth * 0.8;
let height = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
const canvas = document.querySelector('.canvas');
const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true,
	preserveDrawingBuffer: true,
	canvas
});
const light = new THREE.AmbientLight(0xffffff, 1);
const controls = new OrbitControls(camera, renderer.domElement);

scene.add(gridHelper);
renderer.setSize(width, height);
scene.add(light);
camera.position.set(0, 5, 10);

window.addEventListener('resize', () => {
	width = window.innerWidth * 0.8;
	height = window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(width, height);
});

addListeners(scene, camera, gridHelper);
initScene(scene);

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}

if (WebGL.isWebGLAvailable()) {
	animate();
} else {
	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById('container').appendChild(warning);
}

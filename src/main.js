import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import VehicleFactory from './components/vehicleFactory.js';
import SignFactory from './components/signFactory.js';
import RoadFactory from './components/roadFactory.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import SIGN_TEXTURES from './constants/sign_textures.js';
import ROAD_TEXTURES from './constants/road_textures.js';
import VEHICLES from './constants/vehicles.js';

let selectedObject = null;
let previousMaterialColor = '';
let zenitalView = false;
let allowMovement = false;
let movementStep = 0.5;
let rotateStep = 45;

const NON_SELECTABLE_NAME_OBJECTS = ['ground'];
const mouse = new THREE.Vector2();
const width = window.innerWidth * 0.8;
const height = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
const axesHelper = new THREE.AxesHelper(5);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const light = new THREE.AmbientLight(0xffffff, 1);
const controls = new OrbitControls(camera, renderer.domElement);

scene.add(gridHelper);
scene.add(axesHelper);
axesHelper.visible = false;
renderer.setSize(width, height);
document.querySelector('.canvas').appendChild(renderer.domElement);
scene.add(light);
camera.position.set(0, 5, 10);

window.addEventListener('resize', () => {
	camera.updateProjectionMatrix();
	renderer.setSize(width, height);
});

function resetSelectedObject() {
	if (selectedObject) {
		selectedObject.material?.color?.setHex(previousMaterialColor);
		previousMaterialColor = '';
		if (selectedObject.isVehicle) {
			selectedObject.material.opacity = 0.0;
		}
		selectedObject = null;
		updateObjectInfo({ rotation: { y: 0 }, position: { x: 0, y: 0, z: 0 } });
	}
}

function selectObject(object) {
	if (!object) return;
	resetSelectedObject();
	selectedObject = object;
	previousMaterialColor = object.material?.color?.getHex();
	object.material?.color?.setHex('0xFFDE59');
	if (object.isVehicle) {
		object.material.opacity = 0.5;
	}
	updateObjectInfo(object);
}

function updateObjectInfo(object) {
	document.querySelector('#rotate-number').value =
		object.rotation.y * (180 / Math.PI);
	document.querySelector('#rotate').value = object.rotation.y * (180 / Math.PI);
	document.querySelector('#position-x').value = object.position.x;
	document.querySelector('#position-y').value = object.position.y;
	document.querySelector('#position-z').value = object.position.z;
}

function flipSelectedTexture() {
	if (!selectedObject) return;
	selectedObject.material.map.repeat.x =
		selectedObject.material.map.repeat.x > 0 ? -1 : 1;
}

/**
 * Logicals listeners for UI
 */
document.addEventListener('DOMContentLoaded', () => {
	Object.values(SIGN_TEXTURES).forEach((filename) => {
		const img = document.createElement('img');
		img.draggable = true;
		img.src = `/src/textures/${filename}`;
		img.alt = filename;
		img.dataset.type = 'sign';
		img.addEventListener('click', () => {
			const sign = SignFactory.createSign(filename);
			scene.add(sign);
			selectObject(sign);
			allowMovement = true;
		});
		document.querySelector('#gallery').appendChild(img);
	});
	Object.values(ROAD_TEXTURES).forEach((filename) => {
		const img = document.createElement('img');
		img.src = `/src/textures/${filename}.jpg`;
		img.alt = filename;
		img.dataset.type = 'road';
		img.addEventListener('click', () => {
			const road = RoadFactory.createRoad(filename);
			scene.add(road);
			selectObject(road);
			allowMovement = true;
		});
		document.querySelector('#gallery').appendChild(img);
	});
	Object.keys(VEHICLES).forEach((key) => {
		const img = document.createElement('img');
		img.src = `/assets/vehicle_icons/${key}.png`;
		img.alt = key;
		img.dataset.type = 'vehicle';
		img.addEventListener('click', () => {
			VehicleFactory.createVehicle(key).then((vehicle) => {
				scene.add(vehicle);
				selectObject(vehicle);
				allowMovement = true;
			});
		});
		document.querySelector('#gallery').appendChild(img);
	});
});
document.querySelector('#load').addEventListener('click', () => {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';
	input.addEventListener('change', (e) => {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			const json = JSON.parse(e.target.result);
			const loader = new GLTFLoader();
			loader.parse(json, '', (gltf) => {
				scene.add(gltf.scene);
			});
		};
		reader.readAsText(file);
	});
	input.click();
});
document.querySelector('#export').addEventListener('click', () => {
	scene.updateMatrixWorld();
	const blob = new Blob([JSON.stringify(scene.toJSON())], {
		type: 'text/plain'
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'scene.json';
	a.click();
});
document.querySelector('#gallery-filter').addEventListener('change', (e) => {
	const type = e.target.value;
	const images = document.querySelectorAll('#gallery img');
	images.forEach((img) => {
		if (type === 'all' || img.dataset.type === type) {
			img.classList.remove('hide');
		} else {
			img.classList.add('hide');
		}
	});
});
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		if (!selectedObject) return;
		resetSelectedObject();
	} else if (e.key === 'Backspace') {
		if (!selectedObject) return;
		scene.remove(selectedObject);
		resetSelectedObject();
	} else if (e.key === 'm') {
		allowMovement = !allowMovement;
		document.querySelector('#move').checked = allowMovement;
	} else if (e.key === 'a') {
		axesHelper.visible = !axesHelper.visible;
		document.querySelector('#toggle-axes').checked = axesHelper.visible;
	} else if (e.key === 'g') {
		gridHelper.visible = !gridHelper.visible;
		document.querySelector('#toggle-grid').checked = gridHelper.visible;
	} else if (e.key === 'c' && selectedObject) {
		const cloned = selectedObject.clone();
		cloned.position.x += 1;
		cloned.position.z += 1;
		scene.add(cloned);
		selectObject(cloned);
	} else if (e.key === 'f') {
		flipSelectedTexture();
	}
});
document.querySelector('#move').addEventListener('change', (e) => {
	allowMovement = e.target.checked;
});
document.querySelector('#flip-texture').addEventListener('click', () => {
	flipSelectedTexture();
});
document.querySelector('#toggle-view').addEventListener('click', () => {
	zenitalView = !zenitalView;
	if (!zenitalView) {
		camera.position.set(0, 5, 10);
		camera.lookAt(0, 0, 0);
	} else {
		camera.position.set(0, 10, 0);
		camera.lookAt(0, 0, 0);
	}
});
document.querySelector('#toggle-grid').addEventListener('click', () => {
	gridHelper.visible = !gridHelper.visible;
});
document.querySelector('#toggle-axes').addEventListener('click', () => {
	axesHelper.visible = !axesHelper.visible;
});
document.querySelector('#reset-position').addEventListener('click', () => {
	if (!selectedObject) return;
	selectedObject.position.set(0, 0, 0);
	updateObjectInfo(selectedObject);
});
document.querySelector('#reset-rotation').addEventListener('click', () => {
	if (!selectedObject) return;
	selectedObject.rotation.set(0, 0, 0);
	updateObjectInfo(selectedObject);
});
document.querySelector('#rotate-left').addEventListener('click', () => {
	if (!selectedObject) return;
	selectedObject.rotation.y -= (rotateStep * Math.PI) / 180;
	updateObjectInfo(selectedObject);
});
document.querySelector('#rotate-right').addEventListener('click', () => {
	if (!selectedObject) return;
	selectedObject.rotation.y += (rotateStep * Math.PI) / 180;
	updateObjectInfo(selectedObject);
});
document.querySelector('#rotate').addEventListener('change', (e) => {
	document.querySelector('#rotate-number').value = e.target.value;
	if (!selectedObject) return;
	const x = document.querySelector('#rotation-x').checked
		? e.target.value
		: selectedObject.rotation.x;
	const y = document.querySelector('#rotation-y').checked
		? e.target.value
		: selectedObject.rotation.y;
	const z = document.querySelector('#rotation-z').checked
		? e.target.value
		: selectedObject.rotation.z;
	selectedObject.rotation.set(
		(x * Math.PI) / 180,
		(y * Math.PI) / 180,
		(z * Math.PI) / 180
	);
});
document.querySelector('#rotate-number').addEventListener('change', (e) => {
	document.querySelector('#rotate').value = e.target.value;
	if (!selectedObject) return;
	const x = document.querySelector('#rotation-x').checked
		? e.target.value
		: selectedObject.rotation.x;
	const y = document.querySelector('#rotation-y').checked
		? e.target.value
		: selectedObject.rotation.y;
	const z = document.querySelector('#rotation-z').checked
		? e.target.value
		: selectedObject.rotation.z;
	selectedObject.rotation.set(
		(x * Math.PI) / 180,
		(y * Math.PI) / 180,
		(z * Math.PI) / 180
	);
});
document.querySelector('#position-x').addEventListener('change', (e) => {
	if (!selectedObject) return;
	selectedObject.position.x = e.target.value;
});
document.querySelector('#position-z').addEventListener('change', (e) => {
	if (!selectedObject) return;
	selectedObject.position.z = e.target.value;
});
document.querySelector('#movement-step').addEventListener('change', (e) => {
	movementStep = Number(e.target.value);
});
document.querySelector('#rotate-step').addEventListener('change', (e) => {
	rotateStep = Number(e.target.value);
});
window.addEventListener('mousemove', (e) => {
	mouse.x = (e.clientX / width) * 2 - 1;
	mouse.y = -(e.clientY / height) * 2 + 1;
	if (selectedObject && allowMovement) {
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, camera);
		const found = raycaster.intersectObjects(scene.children);
		for (let obj of found) {
			selectedObject.position.x = obj.point.x;
			selectedObject.position.z = obj.point.z;
			const oldY = selectedObject.position.y;
			selectedObject.position
				.divideScalar(1)
				.floor()
				.multiplyScalar(1)
				.addScalar(movementStep);
			selectedObject.position.y = oldY;
		}
	}
});
document.querySelector('.canvas').addEventListener('click', (e) => {
	if (selectedObject && selectedObject.isDraggable && allowMovement) {
		allowMovement = false;
		document.querySelector('#move').checked = allowMovement;
	}
	e.preventDefault();
	camera.updateMatrixWorld();
	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse.clone(), camera);
	const intersects = raycaster.intersectObjects(scene.children);

	resetSelectedObject();

	let object = intersects.find((object) => {
		return object.object.type === 'Mesh';
	});
	if (
		!object ||
		(object && NON_SELECTABLE_NAME_OBJECTS.includes(object.object.name))
	)
		return;
	let selected = object.object;
	if (selected.parent?.parent?.isVehicle) {
		selected = selected.parent.parent;
	}
	selectObject(selected);
});
/**
 * End of logical listeners
 */

function createInitialGround() {
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
	VehicleFactory.createVehicle('Ambulance').then((vehicle) => {
		scene.add(vehicle);
	});
	// scene.add(ambulance);
}

createInitialGround();

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

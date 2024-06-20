import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import SIGN_TEXTURES from './sign_textures.js';
import ROAD_TEXTURES from './road_textures.js';
import VEHICLES from './models/vehicles.js';

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
const gltfLoader = new GLTFLoader();

const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.showY = false;
scene.add(transformControls);
scene.add(gridHelper);
scene.add(axesHelper);
axesHelper.visible = false;
renderer.setSize(width, height);
document.querySelector('.canvas').appendChild(renderer.domElement);
scene.add(light);
camera.position.set(0, 5, 10);

transformControls.addEventListener('dragging-changed', function (event) {
	controls.enabled = !event.value;
});

window.addEventListener('resize', () => {
	camera.updateProjectionMatrix();
	renderer.setSize(width, height);
});

function resetSelectedObject() {
	if (selectedObject) {
		selectedObject.material?.color?.setHex(previousMaterialColor);
		selectedObject = null;
		transformControls.detach();
		previousMaterialColor = '';
		updateObjectInfo({ rotation: { y: 0 }, position: { x: 0, y: 0, z: 0 } });
	}
}

function selectObject(object) {
	if (!object) return;
	resetSelectedObject();
	selectedObject = object;
	if (selectObject.isVehicle) {
		transformControls.attach(selectedObject);
	}
	previousMaterialColor = object.material?.color?.getHex();
	object.material?.color?.setHex('0xFFDE59');
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

function dumpObject(obj, lines = [], isLast = true, prefix = '') {
	const localPrefix = isLast ? '└─' : '├─';
	lines.push(
		`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${
			obj.type
		}]`
	);
	const newPrefix = prefix + (isLast ? '  ' : '│ ');
	const lastNdx = obj.children.length - 1;
	obj.children.forEach((child, ndx) => {
		const isLast = ndx === lastNdx;
		dumpObject(child, lines, isLast, newPrefix);
	});
	return lines;
}

function createVehicleObject(vehicle) {
	gltfLoader.load(
		`models/vehicles/${vehicle}/${vehicle}.gltf`,
		(gltf) => {
			const vehicleNode = gltf.scene.getObjectByName('RootNode');
			console.log(dumpObject(vehicleNode).join('\n'));
			vehicleNode.isVehicle = true;
			vehicleNode.isDraggable = true;
			vehicleNode.position.set(0, 0, 0);
			const scale = vehicle === 'ElectricScooter' ? 1.6 : 0.25;
			vehicleNode.scale.set(scale, scale, scale);
			scene.add(vehicleNode);
			selectObject(vehicleNode);
			allowMovement = true;
		},
		undefined,
		(error) => {
			console.error(error);
		}
	);
}

/**
 * Logicals listeners for UI
 */
document.addEventListener('DOMContentLoaded', () => {
	Object.values(SIGN_TEXTURES).forEach((filename) => {
		const img = document.createElement('img');
		img.draggable = true;
		img.src = `models/textures/${filename}`;
		img.alt = filename;
		img.dataset.type = 'sign';
		img.addEventListener('dragstart', (e) => {
			e.dataTransfer.setData('type', 'sign');
			e.dataTransfer.setData('texture', `models/textures/${filename}`);
			e.dataTransfer.setData('alt', filename);
		});
		img.addEventListener('click', () => {
			const geometry = new THREE.CylinderGeometry(1, 1, 0.1);
			const texture = new THREE.TextureLoader().load(
				`models/textures/${filename}`
			);
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
			sign.isDraggable = true;
			sign.scale.set(0.25, 0.25, 0.25);
			const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2);
			const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
			const pole = new THREE.Mesh(poleGeometry, poleMaterial);
			pole.position.set(0, -2, 0);
			sign.add(pole);
			scene.add(sign);
			selectObject(sign);
			allowMovement = true;
		});
		document.querySelector('#gallery').appendChild(img);
	});
	Object.values(ROAD_TEXTURES).forEach((filename) => {
		const img = document.createElement('img');
		img.src = `models/textures/${filename}.jpg`;
		img.alt = filename;
		img.dataset.type = 'road';
		img.addEventListener('dragstart', (e) => {
			e.dataTransfer.setData('type', 'road');
			e.dataTransfer.setData('texture', `models/textures/${filename}.jpg`);
			e.dataTransfer.setData('alt', filename);
		});
		img.addEventListener('click', () => {
			const road = createTexturedRoadObject(filename);
			scene.add(road);
			selectObject(road);
			allowMovement = true;
		});
		document.querySelector('#gallery').appendChild(img);
	});
	Object.keys(VEHICLES).forEach((key) => {
		const img = document.createElement('img');
		img.src = `static/vehicle_icons/${key}.png`;
		img.alt = key;
		img.dataset.type = 'vehicle';
		img.addEventListener('dragstart', (e) => {
			e.dataTransfer.setData('type', 'vehicle');
			e.dataTransfer.setData('texture', `static/vehicle_icons/${key}.png`);
			e.dataTransfer.setData('alt', key);
		});
		img.addEventListener('click', () => {
			const vehicle = createVehicleObject(key);
			scene.add(vehicle);
			selectObject(vehicle);
			allowMovement = true;
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

function setInitialScene() {
	const geometry = new THREE.PlaneGeometry(20, 20);
	const texture = new THREE.TextureLoader().load(
		'models/textures/concrete.jpg'
	);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(10, 10);
	const material = new THREE.MeshBasicMaterial({ map: texture });
	const plane = new THREE.Mesh(geometry, material);
	plane.rotation.x = -Math.PI / 2;
	plane.position.set(0, -0.01, 0);
	plane.name = 'ground';
	scene.add(plane);
	addCube();
}
function addCube() {
	const geometry = new THREE.BoxGeometry();
	const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const cube = new THREE.Mesh(geometry, material);
	cube.position.set(0, 0, 0);
	scene.add(cube);
}

function createTexturedRoadObject(textureSelected) {
	const geometry = new THREE.BoxGeometry(1, 0.1, 1);
	const texture = new THREE.TextureLoader().load(
		`models/textures/${textureSelected}.jpg`
	);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(1, 1);
	const material = new THREE.MeshBasicMaterial({ map: texture });
	const road = new THREE.Mesh(geometry, material);
	road.position.set(0, 0, 0);
	road.isDraggable = true;
	return road;
}

setInitialScene();

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

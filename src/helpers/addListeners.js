import * as THREE from 'three';
import SignFactory from '../components/signFactory.js';
import RoadFactory from '../components/roadFactory.js';
import VehicleFactory from '../components/vehicleFactory.js';
import PeopleFactory from '../components/peopleFactory.js';
import EnvironmentFactory from '../components/environmentFactory.js';
import SIGN_TEXTURES from '../constants/sign_textures.js';
import ROAD_TEXTURES from '../constants/road_textures.js';
import PEOPLE from '../constants/people.js';
import ENVIRONMENT from '../constants/environment.js';
import VEHICLES from '../constants/vehicles.js';
import { initScene } from '../helpers/scene.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

let zenitalView = false;
let allowMovement = false;
let movementStep = 0.5;
let rotateStep = 45;
let previousMaterialColor = '';
let selectedObject = null;
let gridHelper = null;
let orbitControls = null;
let scene = null;
let camera = null;
let control = null;
let renderer = null;
let controlMode = 'translate';

const NON_SELECTABLE_NAME_OBJECTS = ['ground'];
const mouse = new THREE.Vector2();
const width = window.innerWidth;
const height = window.innerHeight;

function resetSelectedObject() {
	if (selectedObject) {
		control.detach();
		selectedObject.material?.color?.setHex(previousMaterialColor);
		previousMaterialColor = '';
		if (selectedObject.isTransparent) {
			selectedObject.material.opacity = 0.0;
		}
		selectedObject = null;
	}
}

function selectObject(object) {
	if (
		!object ||
		(object && object.customType !== 'Road' && !object.isDraggable)
	)
		return;
	resetSelectedObject();
	selectedObject = object;
	if (selectedObject.isDraggable) {
		control.attach(selectedObject);
	}
	previousMaterialColor = object.material?.color?.getHex();
	object.material?.color?.setHex('0xFFDE59');
	if (object.isTransparent) {
		object.material.opacity = 0.5;
	}
}

function flipSelectedTexture() {
	if (!selectedObject) return;
	selectedObject.material.map.repeat.x =
		selectedObject.material.map.repeat.x > 0 ? -1 : 1;
}

function changeVehicleColor(child, name, hexColor) {
	if (
		child.name !== name ||
		![
			'Sedan',
			'SUV',
			'Pickup',
			'Truck_with_trailer',
			'Group_008',
			'bicycle'
		].includes(name)
	) {
		return;
	}
	const mainMesh = name === 'bicycle' ? 'Cylinder' : '_1';
	child.children.forEach((part) => {
		if (part.type === 'Mesh' && part.name.includes(mainMesh) && hexColor) {
			part.material.color.set(hexColor);
		}
	});
}

function getNameForVehicleColor(name) {
	if (name === 'TruckTrailer') {
		return 'Truck_with_trailer';
	} else if (name === 'Motorbike') {
		return 'Group_008';
	} else if (name === 'Bicycle') {
		return 'bicycle';
	}
	return name;
}

function addListeners(
	mainScene,
	mainCamera,
	mainGridHelper,
	mainRenderer,
	mainOrbitControls
) {
	scene = mainScene;
	camera = mainCamera;
	gridHelper = mainGridHelper;
	renderer = mainRenderer;
	orbitControls = mainOrbitControls;
	control = new TransformControls(camera, renderer.domElement);
	control.showY = false;
	control.setMode(controlMode);
	control.addEventListener('change', function () {
		renderer.render(scene, camera);
	});
	control.addEventListener('dragging-changed', function (event) {
		orbitControls.enabled = !event.value;
	});
	scene.add(control);
	document.addEventListener('DOMContentLoaded', () => {
		document.querySelector('h4').addEventListener('click', (el) => {
			const collapsableElement = document.querySelector('.collapsable');
			const isHidden = collapsableElement.classList.contains('hide');
			const search = isHidden ? '▸' : '▾';
			const replacement = isHidden ? '▾' : '▸';
			el.target.innerText = el.target.innerText.replace(search, replacement);
			collapsableElement.classList.toggle('hide');
		});
		Object.values(SIGN_TEXTURES).forEach((filename) => {
			const img = document.createElement('img');
			img.draggable = true;
			img.src = `/assets/textures/${filename}`;
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
			img.src = `/assets/textures/${filename}.jpg`;
			if (filename === 'roundabout') {
				img.src = `/assets/environment_icons/${filename}.png`;
			}
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
		Object.keys(PEOPLE).forEach((key) => {
			const img = document.createElement('img');
			img.src = `/assets/people_icons/${key}.png`;
			img.alt = key;
			img.dataset.type = 'people';
			img.addEventListener('click', () => {
				PeopleFactory.createPeople(key).then((people) => {
					scene.add(people);
					selectObject(people);
					allowMovement = true;
				});
			});
			document.querySelector('#gallery').appendChild(img);
		});
		Object.keys(ENVIRONMENT).forEach((key) => {
			const img = document.createElement('img');
			img.src = `/assets/environment_icons/${key}.png`;
			img.alt = key;
			img.dataset.type = 'environment';
			img.addEventListener('click', () => {
				EnvironmentFactory.createObject(key).then((object) => {
					scene.add(object);
					selectObject(object);
					allowMovement = true;
				});
			});
			document.querySelector('#gallery').appendChild(img);
		});
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
			allowMovement = !allowMovement;
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
		selectObject(selected);
	});
}

function loadScene() {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';
	input.addEventListener('change', (e) => {
		const file = e.target.files[0];
		const reader = new FileReader();
		scene.clear();
		reader.onload = (e) => {
			const data = JSON.parse(e.target.result);
			initScene(scene, gridHelper, camera, renderer, orbitControls);
			data.forEach((item) => {
				if (item.type !== 'Mesh') return;
				switch (item.customType) {
					case 'Sign':
						const sign = SignFactory.createSign(item.name);
						sign.position.set(
							item.position.x,
							item.position.y,
							item.position.z
						);
						sign.rotation.set(
							item.rotation.x,
							item.rotation.y,
							item.rotation.z
						);
						scene.add(sign);
						break;
					case 'Road':
						const road = RoadFactory.createRoad(item.name);
						road.position.set(
							item.position.x,
							item.position.y,
							item.position.z
						);
						road.rotation.set;
						scene.add(road);
						break;
					case 'Vehicle':
						VehicleFactory.createVehicle(item.name).then((vehicle) => {
							vehicle.position.set(
								item.position.x,
								item.position.y,
								item.position.z
							);
							vehicle.rotation.set(
								item.rotation.x,
								item.rotation.y,
								item.rotation.z
							);
							changeVehicleColor(
								vehicle.children[0].children[0],
								getNameForVehicleColor(item.name),
								item.vehicleColor
							);
							scene.add(vehicle);
						});
						break;
					case 'People':
						PeopleFactory.createPeople(item.name).then((people) => {
							people.position.set(
								item.position.x,
								item.position.y,
								item.position.z
							);
							people.rotation.set(
								item.rotation.x,
								item.rotation.y,
								item.rotation.z
							);
							scene.add(people);
						});
						break;
					case 'Environment':
						EnvironmentFactory.createObject(item.name).then((object) => {
							object.position.set(
								item.position.x,
								item.position.y,
								item.position.z
							);
							object.rotation.set(
								item.rotation.x,
								item.rotation.y,
								item.rotation.z
							);
							scene.add(object);
						});
						break;
					default:
						break;
				}
			});
		};
		reader.readAsText(file);
	});
	input.click();
}

function exportScene() {
	scene.updateMatrixWorld();
	const data = [];
	scene.children.forEach((child) => {
		if (child.type !== 'Mesh' || child.name === 'ground') return;
		const objectInfo = {
			name: child.name,
			type: child.type,
			customType: child.customType,
			position: {
				x: child.position.x,
				y: child.position.y,
				z: child.position.z
			},
			rotation: {
				x: child.rotation.x,
				y: child.rotation.y,
				z: child.rotation.z
			},
			scale: {
				x: child.scale.x,
				y: child.scale.y,
				z: child.scale.z
			}
		};
		if (child.isVehicle) {
			objectInfo.vehicleColor = child.vehicleColor;
		}
		data.push(objectInfo);
	});
	const blob = new Blob([JSON.stringify(data)], {
		type: 'text/plain'
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'scene.json';
	a.click();
}

function screenshot() {
	const cav = document.querySelector('.canvas');
	const base64 = cav.toDataURL('img/png');
	var a = document.createElement('a');
	a.href = base64;
	const date = new Date();
	const timestamp =
		date.toLocaleDateString('en-ca').replaceAll('-', '') +
		'_' +
		date.getHours().toString() +
		date.getMinutes().toString() +
		date.getSeconds().toString() +
		date.getMilliseconds().toString();
	a.download = `atestator-${timestamp}.png`;
	a.click();
}

function toggleGrid() {
	gridHelper.visible = !gridHelper.visible;
}

function addPanel() {
	const panel = new GUI({ width: 310 });

	const folder1 = panel.addFolder('Actions');
	const folder2 = panel.addFolder('Rotation');
	const folder3 = panel.addFolder('Traslation');
	const folder4 = panel.addFolder('Settings');

	const settings = {
		Load: function () {
			loadScene();
		},
		Export: function () {
			exportScene();
		},
		Screenshot: function () {
			screenshot();
		},
		'Show grid': true,
		'Rotation X': 0.0,
		'Rotation Y': 0.0,
		'Rotation Z': 0.0,
		'Position X': 0.0,
		'Position Y': 0.0,
		'Position Z': 0.0,
		'Modify rotation step size': 45.0,
		'Modify position step size': 0.5,
		'Vehicle color': '#000000',
		'Flip texture': function () {
			flipSelectedTexture();
		},
		'Toggle view': function () {
			zenitalView = !zenitalView;
			if (!zenitalView) {
				camera.position.set(0, 5, 10);
				camera.rotation.set(0, 0, 0);
				camera.lookAt(0, 0, 0);
			} else {
				camera.position.set(0, 10, 0);
				camera.rotation.set(0, 0, 0);
				camera.lookAt(0, 0, 0);
			}
		},
		'Control mode': 'translate'
	};

	folder1.add(settings, 'Load');
	folder1.add(settings, 'Export');
	folder1.add(settings, 'Screenshot');
	const rotateXSlider = folder2
		.add(settings, 'Rotation X', 0.0, 360, rotateStep)
		.onChange((value) => {
			if (!selectedObject) return;
			selectedObject.rotation.x = (value * Math.PI) / 180;
		});
	const rotateYSlider = folder2
		.add(settings, 'Rotation Y', 0.0, 360, rotateStep)
		.onChange((value) => {
			if (!selectedObject) return;
			selectedObject.rotation.y = (value * Math.PI) / 180;
		});
	const rotateZSlider = folder2
		.add(settings, 'Rotation Z', 0.0, 360, rotateStep)
		.onChange((value) => {
			if (!selectedObject) return;
			selectedObject.rotation.z = (value * Math.PI) / 180;
		});
	folder2
		.add(settings, 'Modify rotation step size', 1, 360, 1)
		.onChange((value) => {
			rotateStep = value;
			rotateXSlider.step(rotateStep);
			rotateYSlider.step(rotateStep);
			rotateZSlider.step(rotateStep);
		});
	folder3.add(settings, 'Position X', -10, 10, 0.5).onChange((value) => {
		if (!selectedObject) return;
		selectedObject.position.x = value;
	});
	folder3
		.add(settings, 'Position Y', -10, 10, 0.5)
		.onChange((value) => {
			if (!selectedObject) return;
			selectedObject.position.y = value;
		})
		.disable();
	folder3.add(settings, 'Position Z', -10, 10, 0.5).onChange((value) => {
		if (!selectedObject) return;
		selectedObject.position.z = value;
	});
	folder4
		.add(settings, 'Control mode', ['translate', 'rotate'])
		.onChange((value) => {
			controlMode = value;
			control.setMode(controlMode);
			control.showY = value === 'rotate';
		});
	folder4.add(settings, 'Show grid').onChange(toggleGrid);
	folder4.addColor(settings, 'Vehicle color').onChange(function (value) {
		if (!selectedObject || !selectedObject.isVehicle) return;
		let name = getNameForVehicleColor(selectedObject.name);
		const hexColor = value;
		selectedObject.vehicleColor = hexColor;
		selectedObject.children[0].children.forEach((child) => {
			changeVehicleColor(child, name, hexColor);
		});
	});
	folder4.add(settings, 'Flip texture');
	folder4.add(settings, 'Toggle view');

	folder1.open();
	folder2.open();
	folder3.open();
	folder4.open();
}
addPanel();

export default addListeners;

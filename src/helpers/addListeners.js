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

let zenitalView = false;
let allowMovement = false;
let movementStep = 0.5;
let rotateStep = 45;
let previousMaterialColor = '';
let selectedObject = null;

const NON_SELECTABLE_NAME_OBJECTS = ['ground'];
const mouse = new THREE.Vector2();
const width = window.innerWidth * 0.8;
const height = window.innerHeight;

function resetSelectedObject() {
	if (selectedObject) {
		selectedObject.material?.color?.setHex(previousMaterialColor);
		previousMaterialColor = '';
		if (selectedObject.isTransparent) {
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
	if (object.isTransparent) {
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

function addListeners(scene, camera, gridHelper) {
	document.addEventListener('DOMContentLoaded', () => {
		document
			.querySelector('#vehicle-color')
			.addEventListener('change', (event) => {
				if (!selectedObject && !selectedObject.isVehicle) return;
				let name = getNameForVehicleColor(selectedObject.name);
				const hexColor = event.target.value;
				selectedObject.vehicleColor = hexColor;
				selectedObject.children[0].children.forEach((child) => {
					changeVehicleColor(child, name, hexColor);
				});
			});
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
	document.querySelector('#load').addEventListener('click', () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.addEventListener('change', (e) => {
			const file = e.target.files[0];
			const reader = new FileReader();
			scene.clear();
			reader.onload = (e) => {
				const data = JSON.parse(e.target.result);
				initScene(scene, gridHelper);
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
	});
	document.querySelector('#screenshot')?.addEventListener('click', () => {
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
	});
	document.querySelector('#export').addEventListener('click', () => {
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
}

export default addListeners;

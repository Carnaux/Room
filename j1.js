/*------------------------------------------------ */

let interestDatabase = ["food", "books"];

let peopleArr = [];

let AOIs = [];

let loadedModels = [];

let loadedMaterials = [];

let paths = [];
let objects = [];

THREE.Pathfinding = threePathfinding.Pathfinding;

const pathfinder = new THREE.Pathfinding();

const mouse = new THREE.Vector2();

let level;

let playerNavMeshGroup, calculatedPath;

let calculatePath = false;

const pathfollower = new PathFollower();

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

scene.background = new THREE.Color("rgb(63,63,63)");

let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

const light = new THREE.AmbientLight(0x404040, 4); // soft white light
scene.add(light);

var axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

let controls = new THREE.OrbitControls(camera, renderer.domElement);

document.addEventListener("mousedown", onDocumentMouseDown, false);


createAOI("food", new THREE.Vector3(3,0.3, -6));
createAOI("books", new THREE.Vector3(1, 0.3, 6));

console.log(AOIs);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  pathfollower.update();
  renderer.render(scene, camera);
}

animate();



function onDocumentMouseDown(event) {
  event.preventDefault();

  mouse.x =(event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1.12;

  let raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);


  if (calculatePath) {

    let intersects = [];
    navMesh.raycast(raycaster, intersects);

    if (intersects.length > 0) {
      

      // Calculate a path to the target and store it
      
      console.log(objects);
      console.log(paths)
      pathfollower.preview(objects, paths);
    }
  }
}

/*---------------------FILE LOADER SYSTEM---------------------*/
function onModelLoad(event) {
  let modelData = event.target.result;

  let objLoader = new THREE.OBJLoader();

  let geometry = objLoader.parse(modelData);
  let pos = new THREE.Vector3(0, 0, 0);

  if (geometry.children.length > 0) {
    for (let i = 0; i < geometry.children.length; i++) {
      let obj = new THREE.Mesh(
        geometry.children[i].geometry,
        geometry.children[i].material
      );

      obj.position.copy(pos);
      loadedModels.push(obj);
      objects.push(obj);
    }
  } else {
    let obj = new THREE.Mesh(geometry.geometry, geometry.material);
    obj.position.copy(pos);

    loadedModels.push(obj);
    objects.push(obj);
  }
}

function onMaterialLoad(event) {
  let materialData = event.target.result;
  let mtlLoader = new THREE.MTLLoader();
  let material = mtlLoader.parse(materialData);
  let info = material.materialsInfo;
  for (let name in info) {
    let newM = material.createMaterial_(name);
    loadedMaterials.push(newM);
  }
  if (loadedMaterials.length > 0) {
    console.log("materials loaded");
  } else {
    console.log("no materials loaded");
  }
}

function onChooseFile(event, onLoadFileHandler) {
  if (typeof window.FileReader !== "function")
    throw "The file API isn't supported on this browser.";
  let input = event.target;
  if (!input) throw "The browser does not properly implement the event object";
  if (!input.files)
    throw "This browser does not support the `files` property of the file input.";
  if (!input.files[0]) return undefined;
  let file = input.files[0];
  let fr = new FileReader();
  fr.onload = onLoadFileHandler;
  fr.readAsText(file);
}

function onPathLoad(event) {
  let pathData = event.target.result;

  let objLoader = new THREE.OBJLoader();

  let nav = objLoader.parse(pathData);

  var geometry = new THREE.Geometry().fromBufferGeometry(  nav.children[0].geometry);
  

  let obj = new THREE.Mesh(
    geometry,
    nav.children[0].material
  );
  obj.material.wireframe = true;
  obj.position.set(0,0,0);
  navMesh = obj;
  scene.add(obj);

  console.time('createZone()');
	var zoneNodes = THREE.Pathfinding.createZone(geometry);
	console.timeEnd('createZone()');
	pathfinder.setZoneData('level', zoneNodes);

  createPeople(new THREE.Vector3(0, 0.3,0));
  decideWhatToDo(peopleArr[0]);
  calculatePath = true;
}

function loadOBJMTL() {
  if (loadedMaterials.length > 0) {
    for (let i = 0; i < loadedModels.length; i++) {
      loadedModels[i].material = loadedMaterials[i];
      loadedModels[i].needsUpdate = true;
      scene.add(loadedModels[i]);
    }
  } else {
    for (let i = 0; i < loadedModels.length; i++) {
      scene.add(loadedModels[i]);
    }
  }
}

function createPeople(pos){
  var geometry = new THREE.SphereGeometry( 0.25, 32, 32 );
  var material = new THREE.MeshBasicMaterial( {} );
  let personMesh = new THREE.Mesh( geometry, material );
  let personPosition = new THREE.Vector3();
  personPosition.copy(pos);

  let personInterests = {};
  for(let i = 0; i < interestDatabase.length; i++){
    personInterests[interestDatabase[i]] = Math.floor(Math.random() * 11) + 1 ;
  }

  let person = {
    body: personMesh,
    interests: personInterests,
    position: personPosition
  }
  
  scene.add(personMesh);
  peopleArr.push(person);
  console.log(person)
}

function createAOI(interest, position){
  var geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
  var material = new THREE.MeshBasicMaterial( {} );
  let buildingMesh = new THREE.Mesh( geometry, material );

  buildingMesh.position.copy(position);

  let areaOfInterest = {
    mesh: buildingMesh,
    interest: interest,
    position: position
  }

  AOIs.push(areaOfInterest);

  scene.add(buildingMesh);
}

function decideWhatToDo(person){
  var keys = Object.keys(person.interests);
  keys.sort(function(a,b){
    return person.interests[b] - person.interests[a];
  });
  let currentInterest = keys[0];
  console.log(currentInterest)

  closestAOI(currentInterest, person);
}

function closestAOI(name, person){
  let candidatePlaces = [];

  let personPos = person.position

  for(let i = 0; i < AOIs.length; i++){
    if(AOIs[i].interest == name){
      candidatePlaces.push(AOIs[i]);
    }
  }

  var keys = Object.keys(candidatePlaces);
  keys.sort(function(a,b){
    return candidatePlaces.position[b].distanceTo(personPos) - candidatePlaces.position[a].distanceTo(personPos);
  });
  let closest = candidatePlaces[keys[0]];

  generatePath(person.position, person.body.quaternion, closest.position, person)

}

function generatePath(initialPos, quat, finalPos, person){
  objects.push(person.body);

  playerNavMeshGroup = pathfinder.getGroup('level', initialPos);

  calculatedPath = pathfinder.findPath(initialPos, finalPos, 'level', playerNavMeshGroup);

  let tempPos = [];
  tempPos.push(initialPos);
  for(let i = 0; i < calculatedPath.length; i++){
    tempPos.push(calculatedPath[i]);
  }
  
  let tempQuat = [];
  for(let i = 0; i < tempPos.length; i++){
    tempQuat.push(quat);
  }
  
  let pathEl = {
      position: tempPos,
      rotationQuat: tempQuat
  }
  paths.push(pathEl);

}








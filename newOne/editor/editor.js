var scene, camera, renderer, orbit, control, gridHelper;

let interestDatabase = ["food", "books"];

let peopleArr = [];

let AOIs = [];
let AOIsMesh = [];

let spawns = [];

let clickAOIs = false;
let clickNewAOI = false;
let clickSpawn = false;

let loadedModels = [];

let loadedMaterials = [];

THREE.Pathfinding = threePathfinding.Pathfinding;

const pathfinder = new THREE.Pathfinding();

var map = []; 

let navMesh;

var lastSelected;
var lastSelectedToMaterial;

var mouse = new THREE.Vector2();

var keyframes = [];

let editableObjects = [];
let nonEditable = [];

var pathPoints = [];
var pathObjs = [];

let firstPerson = false;

var exportPath = null;
var exportObj = null;

var popMenu = false;
var overMenu = false;

var keysOpen = false;

var lastKeySelected = new THREE.Vector2();
var lastKeySelectedElement;

var pathUpdate = false;

var size = 15;
var divisions = 15;

var lightState = true;

var pathFollower = new PathFollower();
var geoFile = new GeoFile();


var elementPicker = document.getElementById("colorPicker");
var picker = new Picker(elementPicker);

function initEditor(){
    document.getElementById("editor").style.display = "block";


    scene = new THREE.Scene();
    scene.background = new THREE.Color("rgb(255,255,255)");
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    
    var light = new THREE.AmbientLight(0x404040, 3); // soft white light
    scene.add(light);

    var light = new THREE.DirectionalLight( 0xffffff, 1, 100 );
    light.position.set( 10, 50, 0 ); 			//default; light shining from top
    light.castShadow = true;            // default false
    scene.add( light );

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    var renderDiv = document.getElementById('renderDiv');

    if(renderDiv.hasChildNodes()){
        renderDiv.removeChild(renderDiv.childNodes[0]);
        renderDiv.appendChild( renderer.domElement );
    }else{
        renderDiv.appendChild( renderer.domElement );
    }

    orbit = new THREE.OrbitControls( camera, renderDiv);
    orbit.update();
    orbit.addEventListener( 'change', render );

    control = new THREE.TransformControls( camera, renderDiv);
    control.addEventListener( 'change', render );

    control.addEventListener( 'dragging-changed', function ( event ) {

        orbit.enabled = ! event.value;

    } );
    scene.add(control);

    camera.position.z = 5;

    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'keydown', onkeydown, false);

    
    
    animate();
}

function animate() {
    requestAnimationFrame( animate );
   
    pathFollower.update();
    
    render();
}

function render(){
    renderer.render( scene, camera );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseDown(event) {
    event.preventDefault();
  
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
  
    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
  
    let intersects = raycaster.intersectObjects(editableObjects);
    let intersectsAIO = raycaster.intersectObjects(AOIsMesh);
    let intersectsPath;
    if(navMesh != null){
        intersectsPath = raycaster.intersectObject(navMesh);
    }
   
    //let intersectsNonEditable = raycaster.intersectObjects(nonEditable);

    if(event.button == 0){
       
        if(!popMenu){

            if(clickAOIs){
                if(lastSelected == null){
                    control.attach(intersectsAIO[0].object);
                    lastSelected = intersectsAIO[0].object;

                }else if(lastSelected.id != intersectsAIO[0].object.id ){
                    
                    control.detach(lastSelected);
                    control.attach(intersectsAIO[0].object);
                    lastSelected = intersectsAIO[0].object;
                    
                }
            }else if(clickNewAOI){
                if(intersectsPath.length > 0){
                    
                    createAOI("food", intersectsPath[0].point);
                    lastSelected = AOIsMesh[AOIsMesh.length - 1];
                    control.attach(AOIsMesh[AOIsMesh.length - 1]);
                    clickNewAOI = false;
                }
            }else if(clickSpawn){
                if(intersectsPath.length > 0){
                    createSpawn(intersectsPath[0].point);
                    lastSelected = spawns[spawns.length - 1];
                    control.attach(spawns[spawns.length - 1]);
                    clickSpawn = false;
                    
                }
            }

            // if(intersects.length > 0){ 
            //     if(lastSelected == null){
                    
            //         control.attach(intersects[0].object);
            //         lastSelected = intersects[0].object;
            //         lastSelected.material.opacity = 0.75;
    
            //     } else if(lastSelected.id != intersects[0].object.id ){
                    
            //         control.detach(lastSelected);
            //         lastSelected.material.opacity = 1;
    
            //         control.attach(intersects[0].object);
            //         lastSelected = intersects[0].object;
            //         lastSelected.material.opacity = 0.75;
            //     }
            
               
            // }
        }else{
            if(event.path[0].localName == "canvas" ){
                document.getElementById("optBt").style.display = "none";
                popMenu = false;
            }
        }
       
    }else if(event.button == 2){
        
        if(intersects.length > 0){ 
            if(lastSelected != null){
                document.getElementById("optBt").style.display = "block";
                document.getElementById("optBt").style.top = String(event.clientY) + "px";
                document.getElementById("optBt").style.left= String(event.clientX) + "px";
                
    
                lastSelectedToMaterial = intersects[0].object;
                popMenu = true;
            }
           
           
        }
    }
         
}

function menuState(n){
    if(n == 1){
        menuState = true;
    }else{
        menuState = false
    }

}

function onkeydown(event){
    switch ( event.keyCode ) {

      case 81: // q
          control.setMode( "translate" );
          break;

      case 87: // w
          control.setMode( "rotate" );
          break;

      case 69: // e
          control.setMode( "scale" );
          break;

      case 187:
      case 107: // +, =, num+
          control.setSize( control.size + 0.1 );
          break;

      case 189:
      case 109: // -, _, num-
          control.setSize( Math.max( control.size - 0.1, 0.1 ) );
          break;

      case 88: // X
          control.showX = ! control.showX;
          control.showZ = ! control.showZ;
          control.showY = true;
          break;

      case 67: // c
          control.showX = ! control.showX;
          control.showY = ! control.showY;
          control.showZ = true;
          break;

      case 90: // Z
          control.showZ = ! control.showZ;
          control.showY = ! control.showY;
          control.showX = true;
          break;

      case 32: // Spacebar
          control.enabled = ! control.enabled;
          break;

      case 75: // k
          saveKeyframe();
          break;
          
      case 80:
          preview();
          break;

    }
}

function preview(){
    let spawnTimer = setInterval(spawnPeople, 3000);
    firstPerson = true;
    createPeople(spawns[0].position);
    decideWhatToDo(peopleArr[0]);
    firstPerson = false;
    pathFollower.preview(pathObjs, pathPoints);
    
    
    

}

function onModelLoad(event) {
    let modelData = event.target.result;
  
    let objLoader = new THREE.OBJLoader();
  
    let objArr = objLoader.parse(modelData);

    let r = Math.floor(Math.random() * 256); 
    let g = Math.floor(Math.random() * 256); 
    let b = Math.floor(Math.random() * 256); 

    let textColor = "rgb(" + r + "," + g + "," + b + ")";

    let matColor = new THREE.Color(textColor);
    
    var objMat = new THREE.MeshPhongMaterial( { color: matColor  } );
   
    let pos = new THREE.Vector3(0, 0, 0);
  
    if (objArr.children.length > 0) {
      for (let i = 0; i < objArr.children.length; i++) {

        let geometry = new THREE.Geometry();
        geometry.fromBufferGeometry(  objArr.children[i].geometry );

        let obj = new THREE.Mesh(
          geometry,
          objMat
        );
        obj.position.copy(pos);
        obj.castShadow = true;
        obj.position.set(0,0,0);
        scene.add(obj);
        
        nonEditable.push(obj);
      }
    } else {
      let geometry = new THREE.Geometry();
      geometry.fromBufferGeometry( objArr.geometry);

      let obj = new THREE.Mesh(geometry, objMa);
      obj.position.copy(pos);
      obj.castShadow = true;
      obj.position.set(0,0,0);
      scene.add(obj);
  
      
      nonEditable.push(obj);
    }

    this.value = "";
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

    createAOI("food", new THREE.Vector3(3,0.3, -6));
    createAOI("books", new THREE.Vector3(0.5, 0.3, 6));
   
    calculatePath = true;
}
  
function onMaterialLoad(event) {
    let materialData = event.target.result;
    let mtlLoader = new THREE.MTLLoader();
    let material = mtlLoader.parse(materialData);
    let info = material.materialsInfo;
    let tempMat = [];
    let newMatArr;
  
    for (let name in info) {
      let newM = material.createMaterial_(name);
      tempMat.push(newM);
    }

    newMatArr = material.getAsArray();
  

    for (let i = 0; i < newMatArr.length; i++) {
        lastSelectedToMaterial.material = newMatArr[i];
        lastSelectedToMaterial.needsUpdate = true;
        console.log("Materials Loaded!");
    }
    document.getElementById("optBt").style.display = "none";
    popMenu = false;
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

function transforms(n){
    if(n == 1){
        control.setMode( "translate" );
    }else if(n == 2){
        control.setMode( "rotate" );
    }else if(n == 3){
        control.setMode( "scale" );
    }
}

function deselect(){
    control.detach(lastSelected);
    lastSelected.material.opacity = 1;
    lastSelected = null;
    document.getElementById("optBt").style.display = "none";
    popMenu = false;
    document.getElementById("timeline").style.display = "none";
}

function setClick(){
    popMenu = true;
}

function setModelColor(){
    picker.onDone = function(color) {
        let newColor = new THREE.Color(color.rgbaString);
        lastSelected.material.color = newColor;
        document.getElementById("optBt").style.display = "none";
        popMenu = false;
    };
}

function deleteSelected(){
    for(let i = 0; i < editableObjects.length; i++){
        if(editableObjects[i].id == lastSelected.id){
           editableObjects.splice(i, 1);
        }
    }

    console.log(lastSelected.id);
    for(let i = 0; i < keyframes.length; i++ ){
        if(keyframes[i].obj.id == lastSelected.id){
            scene.remove(keyframes[i].path);
            keyframes.splice(i, 1);
            pathObjs.splice(i, 1);
            pathPoints.splice(i, 1);
        }
    }

    control.detach(lastSelected);
    scene.remove(lastSelected);
    document.getElementById("optBt").style.display = "none";
}

function changeStyleColor(){
    if(lightState){ 
        scene.background = new THREE.Color("rgb(134,142,150)");
        
        
        document.getElementById("lightBt").style.backgroundColor = "white";
        
        document.getElementById("toolbar").style.borderColor = "white";

        let tempEls = document.getElementsByClassName('btn');

        for(let i = 0; i < tempEls.length; i++){
            tempEls[i].style.backgroundColor = "white";
        }
        
        document.getElementById("timeline").style.borderColor = "white";
        document.getElementById("timeline").style.backgroundColor = "rgb(134,142,150)";
        document.getElementById("line").style.backgroundColor = "white";

        
        if(keysOpen){
            let tempKeysDots = document.getElementsByClassName('keyframeDot');

            for(let i = 0; i < tempEls.length; i++){
                tempKeysDots[i].style.backgroundColor = "white";
            }
        }

        lightState = false;
    }else{
        scene.background = new THREE.Color("rgb(255,255,255)");
        
        
        document.getElementById("lightBt").style.backgroundColor = "rgb(134,142,150)";
        
        document.getElementById("toolbar").style.borderColor = "rgb(134,142,150)";

        let tempEls = document.getElementsByClassName('btn');
        
        for(let i = 0; i < tempEls.length; i++){
            tempEls[i].style.backgroundColor = "rgb(134,142,150)";
        }
         
        document.getElementById("timeline").style.borderColor = "rgb(134,142,150)";
        document.getElementById("timeline").style.backgroundColor = "white";
        document.getElementById("line").style.backgroundColor = "rgb(134,142,150)";

        

        if( keysOpen){
            let tempKeysDots = document.getElementsByClassName('keyframeDot');
            for(let i = 0; i < tempEls.length; i++){
                tempKeysDots[i].style.backgroundColor = "rgb(134,142,150)";
            }
        }
       
        lightState = true;
    }
}

function createPeople(pos){
    var geometry = new THREE.SphereGeometry( 0.25, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: new THREE.Color("rgb(0,255,0)")} );
    let personMesh = new THREE.Mesh( geometry, material );

    let personPosition = new THREE.Vector3();
    personPosition.copy(pos);
    personMesh.position.copy(pos);

    let personInterests = {};

    for(let i = 0; i < interestDatabase.length; i++){
      personInterests[interestDatabase[i]] = Math.floor(Math.random() * 11) + 1 ;
    }

    //personInterests["money"] = Math.floor(Math.random() * 4) +1 ;

    //console.log(personInterests);
  
    let person = {
      body: personMesh,
      interests: personInterests,
      position: personPosition,
      money:  Math.floor(Math.random() * 3) + 1
    }
    
    scene.add(personMesh);
    peopleArr.push(person);
}
  
function createAOI(interest, position){
    var geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
    var material = new THREE.MeshBasicMaterial( {color: new THREE.Color("rgb(255,255,0)")} );
    let buildingMesh = new THREE.Mesh( geometry, material );
  
    buildingMesh.position.copy(position);
    let areaOfInterest = {
      mesh: buildingMesh,
      interest: interest,
    }
  
    AOIs.push(areaOfInterest);
    AOIsMesh.push(buildingMesh);
    scene.add(buildingMesh);
}

function createSpawn(position){
    var geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
    var material = new THREE.MeshBasicMaterial( {color: new THREE.Color("rgb(255,0,0)")} );
    let buildingMesh = new THREE.Mesh( geometry, material );
  
    buildingMesh.position.copy(position);

    scene.add(buildingMesh);
    spawns.push(buildingMesh);
}

function spawnPeople(){
    console.log("trying to spawn:");
    for(let i = 0; i < spawns.length; i++){
        let doSpawn = Math.floor(Math.random() * 2);
        if(doSpawn == 1){
            let wichSpawn = Math.floor(Math.random() * spawns.length);
            
            createPeople(spawns[wichSpawn].position);
            decideWhatToDo(peopleArr[peopleArr.length -1]);
            
        }
    }
    console.log("end");
}
  
function decideWhatToDo(person){
    var keys = Object.keys(person.interests);
    keys.sort(function(a,b){
      return person.interests[b] - person.interests[a];
    });
    let currentInterest = keys[0];
    console.log("interest",currentInterest)
  
    closestAOI(currentInterest, person);
}
  
function closestAOI(name, person){
    let candidatePlaces = [];
  
    let personPos = person.position
  
    for(let i = 0; i < AOIs.length; i++){
      if(AOIs[i].interest == name){

        let tempObj = {
            aoi: AOIs[i],
            distance: AOIs[i].mesh.position.distanceTo(personPos)
        }
        candidatePlaces.push(tempObj);
      }
    }
  
    
    candidatePlaces.sort(function(a,b){
      return  a.distance - b.distance;
    });

    let closest = candidatePlaces[0];
    console.log
  
    generatePath(person.position, closest.aoi.mesh.position, person)
    
}
  
function generatePath(initialPos, finalPos, person){
    let tempIndex;
    let found = false;
    
    if(pathObjs.length > 0){
        let tempFound = false;
        for(let i = 0; i < pathObjs.length; i++){
            if(pathObjs[i].id == person.body.id){
                tempIndex = i;
                found = true;
                tempFound = true;
                break;
            }
        }
        if(!tempFound){
            pathObjs.push(person.body);
        }

    }else{
        pathObjs.push(person.body);
    }
    
    playerNavMeshGroup = pathfinder.getGroup('level', initialPos);

    calculatedPath = pathfinder.findPath(initialPos, finalPos, 'level', playerNavMeshGroup);
    
    let tempPos = [];
    tempPos.push(initialPos);
    for(let i = 0; i < calculatedPath.length; i++){
      tempPos.push(calculatedPath[i]);
    }
    
    let tempQuat = [];
    for(let i = 0; i < tempPos.length; i++){
      tempQuat.push(person.body.quaternion);
    }
    
    let pathEl = {
        position: tempPos,
        rotationQuat: tempQuat
    }

    
    if(found){
        pathPoints[tempIndex] = pathEl;
        if(!firstPerson){
            pathFollower.add(null, pathEl, pathObjs[tempIndex].id);
        }
        
    }else{
        let objIndex = pathObjs.length - 1;
        pathPoints[objIndex] = pathEl;
        if(!firstPerson){
            pathFollower.add(pathObjs[objIndex], pathPoints[objIndex]);
        }
    }

   
  
}

function setAois(n){
    // if(n == 1){

    // }
    switch(n){
        case "1":
            clickAOIs = !clickAOIs;
            break;
        case "2":
            clickNewAOI = !clickNewAOI;
            break;
        case "3":
            clickSpawn = !clickSpawn;
            break;
    }
  
}

window.onload = initEditor;
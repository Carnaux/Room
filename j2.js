var pathfinder;
/*------------------------------------------------ */
let objects = [];

let testeArr = [];

let loadedModels = [];

let loadedMaterials = [];

let verticesConnection = [];

let mouse = new THREE.Vector2();

let pathMeshPoints = [];
let createPath = false;
let calculatePath = false;

let navMesh;

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

var geometry = new THREE.BoxGeometry(0.09, 0.5, 0.09);
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
var cube = new THREE.Mesh(geometry, material);
cube.position.set(-1, 0.3, -2);
scene.add(cube);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  
  renderer.render(scene, camera);
}

animate();



function onDocumentMouseDown(event) {
  event.preventDefault();

  mouse.x =(event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1.12;

  let raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  //var intersects = raycaster.intersectObjects(objects);

  if (calculatePath) {
    const intersects = raycaster.intersectObject(navMesh);
    if (intersects.length > 0) {

      let p = new THREE.Vector3();
      p.copy(intersects[0].point);

      let v = new THREE.Vector3();
      v.copy(p).sub(cube.position).normalize();
      
     
    
      
      var geometry = new THREE.Geometry();
      geometry.vertices.push(cube.position, p);

      
      var material = new THREE.LineBasicMaterial({
        color: "rgb(0, 255, 0)"
      });
      var line = new THREE.Line(geometry, material);
      
      scene.add(line);

      var dotGeometry = new THREE.Geometry();
      dotGeometry.vertices.push(p);
      var dotMaterial = new THREE.PointsMaterial({
        size: 5,
        sizeAttenuation: false
      });
      var dot = new THREE.Points(dotGeometry, dotMaterial);
      scene.add(dot);

      calculatePathPoints(p, cube.position);
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
  
  navMesh = obj;
  
  scene.add(obj);

  testeArr.push(obj);

  calculateVerticesConnections(obj.geometry);

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

function calculateVerticesConnections(geometry){

  let triangles = geometry.faces;

  for(let i = 0; i < triangles.length; i++){
    for(let j = 0; j < 3; j++){
      if(j == 0){
        let a = new THREE.Vector3();
        a.copy(geometry.vertices[ triangles[i].a]);
        let connections = calculateVerticesAUX(triangles, a);
        let midpoints = calculateVerticesMidppoints(connections, a);
        let verticeConnect = {
          vertice: a,
          connections: connections,
          midpoints: midpoints
        }
        verticesConnection.push(verticeConnect);

      }else if(j == 1){
        let b = new THREE.Vector3();
        b.copy(geometry.vertices[ triangles[i].b]);
        let connections = calculateVerticesAUX(triangles, b);
        let midpoints = calculateVerticesMidppoints(connections, b);
        let verticeConnect = {
          vertice: b,
          connections: connections,
          midpoints: midpoints
        }
        verticesConnection.push(verticeConnect);

      }else if(j == 2){
        let c = new THREE.Vector3();
        c.copy(geometry.vertices[ triangles[i].c]);
        let connections = calculateVerticesAUX(triangles, c);
        let midpoints = calculateVerticesMidppoints(connections, c);
        let verticeConnect = {
          vertice: c,
          connections: connections,
          midpoints: midpoints
        }
        verticesConnection.push(verticeConnect);

      }
    }
  }

  for(let i = 0; i < verticesConnection.length; i++){
    for(let j = 0; j < verticesConnection.length; j++){
      if(i != j && verticesConnection[i].vertice.equals(verticesConnection[j].vertice)){
        verticesConnection.splice(j, 1);
      } 
    }
  }

  console.log(verticesConnection);

}

function calculateVerticesAUX(triangles, v){
  let connected = [];
  for(let i = 0; i < triangles.length; i++){
      if(v.equals(navMesh.geometry.vertices[ triangles[i].a])){

        connected.push(navMesh.geometry.vertices[ triangles[i].b]);
        connected.push(navMesh.geometry.vertices[ triangles[i].c]);

      }else if(v.equals(navMesh.geometry.vertices[ triangles[i].b])){

        connected.push(navMesh.geometry.vertices[ triangles[i].a]);
        connected.push(navMesh.geometry.vertices[ triangles[i].c]);

      }else if(v.equals(navMesh.geometry.vertices[ triangles[i].c])){

        connected.push(navMesh.geometry.vertices[ triangles[i].a]);
        connected.push(navMesh.geometry.vertices[ triangles[i].b]);

      }
  }

  for(let i = 0; i < connected.length; i++){
      for(let j = 0; j < connected.length; j++){
        if(i != j && connected[i].equals(connected[j])){
          connected.splice(j, 1);
        } 
      }
    }




  return connected;
}

function calculateVerticesMidppoints(connections, v){
  let mids = [];

  for(let i = 0; i < connections.length; i++){
    let midX = (connections[i].x + v.x)/2;
    let midZ = (connections[i].z + v.z)/2;
    let midV = new THREE.Vector3(midX, v.y, midZ);
    mids.push(midV);


    var dotGeometry = new THREE.Geometry();
    dotGeometry.vertices.push(midV);
    var dotMaterial = new THREE.PointsMaterial({
      color: "rgb(0,0,255)",
      size: 5,
      sizeAttenuation: false
    });
    var dot = new THREE.Points(dotGeometry, dotMaterial);
    scene.add(dot);
  }

  return mids;

}

function calculatePathPoints(finalPoint, initialPoint){

  let pathVertices = [];

  let initialTriangle = [];
  let finalTriangle = [];

  let triangles = navMesh.geometry.faces;

  for(let i = 0; i < triangles.length; i++){
    let a = new THREE.Vector3();
    a.copy(navMesh.geometry.vertices[ triangles[i].a]);
    let b = new THREE.Vector3();
    b.copy(navMesh.geometry.vertices[ triangles[i].b]);
    let c = new THREE.Vector3();
    c.copy(navMesh.geometry.vertices[ triangles[i].c]);
    let isOrNot = PointInTriangle(initialPoint, a, b, c);
    if(isOrNot){
      initialTriangle[0] = a;
      initialTriangle[1] = b;
      initialTriangle[2] = c;
    }
    let isOrNot2 = PointInTriangle(finalPoint, a, b, c);
    if(isOrNot2){
      finalTriangle[0] = a;
      finalTriangle[1] = b;
      finalTriangle[2] = c;
    }
  }

  let pathPoint = calculateF(initialTriangle, initialPoint, finalPoint);
  pathVertices.push(pathPoint);

  for(let i = 0; i < pathVertices.length; i++){
    let tempArr = [];
    for(let j = 0; j < verticesConnection.length; j++){
      if(pathVertices[i].v.equals(verticesConnection[j].vertice)){
        tempArr = verticesConnection[j].connections;
      }
    }
 
    let pathPoint = calculateF(tempArr, pathVertices[i].v, finalPoint);

    if(pathPoint.v.equals(finalTriangle[0]) || pathPoint.v.equals(finalTriangle[1]) || pathPoint.v.equals(finalTriangle[2])){
      pathVertices.push(pathPoint);
      i = pathVertices.length;
    }else{
      pathVertices.push(pathPoint);
    }
  }

  let raycaster = new THREE.Raycaster();
  raycaster.set(mouse, camera);


  for(let i = 0; i < pathVertices.length; i++){
      var dotGeometry = new THREE.Geometry();
      dotGeometry.vertices.push( pathVertices[i].v);
      var dotMaterial = new THREE.PointsMaterial({
        color: "rgb(255,0,0)",
        size: 5,
        sizeAttenuation: false
      });
      var dot = new THREE.Points(dotGeometry, dotMaterial);
      scene.add(dot);
    }
 

  
  //console.log("pathVertices",pathVertices);
  
  // for(let i = 0; i < pathVertices.length; i++){
  //   let midpoints = [];
  //   for()


  // }

  // for(let i = 0; i < navMesh.geometry.vertices.length; i++){
  //     let v = {
  //       vertice: navMesh.geometry.vertices[i],
  //       d: initialPoint.distanceTo(navMesh.geometry.vertices[i]),
  //     };
  //     tempDistances.push(v);

  // }

  // tempDistances.sort(compare);
  
  // for(let i = 0; i < tempDistances.length; i++){
  //   for(let j = 0; j < tempDistances.length; j++){
  //     if(i != j && tempDistances[i].d == tempDistances[j].d){
  //       tempDistances.splice(j, 1);
  //     } 
  //   }
  //   geoVertices.push(tempDistances[i].vertice);
  // }

  // let tempPoints = [];
  // let lastPoint = new THREE.Vector3();
  // for(let i = 0; i < verticesDistances.length; i++){
  //   let currentPoint = new THREE.Vector3();
  //   currentPoint.copy(verticesDistances[i].d);
  //   if(currentPoint != lastPoint){
  //     for(let j = 0; j < triangles.length; j++){

  //     }
  //   }
  // }

}

function compareF(a, b) {
  return a.f - b.f
}

function compare(a, b) {
  return a - b
}

function SameSide(p1,p2, a,b){
  let v1 = new THREE.Vector3();
  v1.copy(b).sub(a);
  let v2= new THREE.Vector3();
  v2.copy(p1).sub(a);
  let v3= new THREE.Vector3();
  v3.copy(p2).sub(a);

  let cp1 = new THREE.Vector3();
  cp1.crossVectors(v1, v2)
  let cp2 = new THREE.Vector3();
  cp2.crossVectors(v1, v3);

  let dotValue = cp1.dot(cp2);
  if (dotValue >= 0 ){
    return true
  } else {
    return false
  }
}

function PointInTriangle(p, a,b,c){
  let bool1 = SameSide(p,a, b,c);
  let bool2 = SameSide(p,b, a,c);
  let bool3 = SameSide(p,c, a,b);

  if(bool1 && bool2 && bool3){
    return true
  }else{
    return false
  }
}

function calculateF(arr, p, finalPoint){
  let tempResults = [];
  for(let i = 0; i < arr.length; i++){
    let g = p.distanceTo(arr[i]);
    let h = arr[i].distanceTo(finalPoint);
    let f = g + h;
    let tempValues = {
      f: f,
      v: arr[i]
    }
    tempResults.push(tempValues);
    
  }

  tempResults.sort(compareF);
  return tempResults[0];
  
}


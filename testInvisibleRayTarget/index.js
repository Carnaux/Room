var scene = new THREE.Scene();

scene.background = new THREE.Color("rgb(63,63,63)");
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

let rayPos = new THREE.Vector3(4,0,0);
let dir = new THREE.Vector3();
dir.sub(rayPos).normalize();

raycaster.set(rayPos, dir);


// var geometry = new THREE.BoxGeometry( 1, 1, 1 );
// var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// var cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

var dotGeometry = new THREE.Geometry();
dotGeometry.vertices.push(new THREE.Vector3());
var dotMaterial = new THREE.PointsMaterial({
  size: 10,
  sizeAttenuation: false
});
var dot = new THREE.Points(dotGeometry, dotMaterial);



let controls = new THREE.OrbitControls(camera, renderer.domElement);

camera.position.z = 5;

var intersects = [];
dot.raycast( raycaster, intersects );

console.log(intersects);



var animate = function () {
    requestAnimationFrame( animate );

    controls.update();
  

    renderer.render( scene, camera );
};

animate();
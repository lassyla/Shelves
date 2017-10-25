//three.js tutorial: https://threejs.org/docs/#manual/introduction/Creating-a-scene
//Physijs tutorial: https://github.com/chandlerprall/Physijs/wiki/Basic-Setup

var unclickable = false;
var numbroken = 0;
var shelves = []
var objects = [];
var objectnames = ["pig", "pie", "tomato", "random", "globe", "cup", "can", "books", "spider", "house", "plant", "mountain", "bear", "phone", "bomb"];

Physijs.scripts.worker = './js/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';
var scene = new Physijs.Scene();
scene.setGravity(new THREE.Vector3(0, -10, 0));

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 8);

var renderer = new THREE.WebGLRenderer({
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var loader = new THREE.JSONLoader();

var ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);

//code from https://solutiondesign.com/blog/-/blogs/webgl-and-three-js-lighting/
var bluePoint = new THREE.PointLight(0x0033ff, 1, 150);
bluePoint.position.set( 70, 5, 70 );
scene.add(bluePoint);

var redPoint = new THREE.PointLight(0xff3300, 1, 150);
redPoint.position.set( -70, 5, 70 );
scene.add(redPoint);

var yellowPoint = new THREE.PointLight(0xffff00, .3, 150);
yellowPoint.position.set( 0, 70, 70 );
scene.add(yellowPoint);

//var greenPoint = new THREE.PointLight(0x33ff00, .5, 150);
//greenPoint.position.set( -70, 5, 70 );
//scene.add(greenPoint);
//scene.add(new THREE.PointLightHelper(greenPoint, 3));

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.minDistance = 2;
controls.maxDistance = 10;
controls.enableDamping = true;
controls.DampingFactor = 0.3;
controls.rotateSpeed = 0.2;
controls.enablePan = false;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
window.addEventListener('mousedown', onMouseDown, false);
window.requestAnimationFrame(render);

setUpObjects();
$("#whitescreen").fadeOut("slow");
animate();

updateText("hold on...", "choose something that catches your eye."); 

function setUpObjects() {
    //adding shelves
    for (i = 0; i < 3; i++) {
        shelf = new Physijs.BoxMesh(
            new THREE.CubeGeometry(10, 0.2, 1.2),
            new THREE.MeshLambertMaterial({
                color: 0xaaaaaa
            }),
            0 //mass of zero means no gravity
        );
        shelf.receiveShadow = true;
        shelf.position.set(0, i * -2, 0);
        scene.add(shelf);
        shelves[i] = shelf;
    }

    //adding walls
    material = new THREE.MeshLambertMaterial({
        color: 0xff11ff
    }, 0, 1)
    material.opacity = 0;
    material.transparent = true;

    floor = new Physijs.BoxMesh(new THREE.CubeGeometry(50, 0.2, 50), material, 0);
    floor.position.set(0, -20, 0);
    scene.add(floor);

    backwall = new Physijs.BoxMesh(new THREE.CubeGeometry(25, 40, 0.2), material, 0);
    backwall.position.set(0, 0, -10);
    scene.add(backwall);

    frontwall = new Physijs.BoxMesh(new THREE.CubeGeometry(25, 40, 0.2), material, 0);
    frontwall.position.set(0, 0, 10);
    scene.add(frontwall);

    leftwall = new Physijs.BoxMesh(new THREE.CubeGeometry(0.2, 40, 25), material, 0);
    leftwall.position.set(-10, 0, 0);
    scene.add(leftwall);

    rightwall = new Physijs.BoxMesh(new THREE.CubeGeometry(0.2, 40, 25), material, 0);
    rightwall.position.set(10, 0, 0);
    scene.add(rightwall);

    //adding objects
    for (i = 0; i < 5; i++) {
        for (j = 0; j < 3; j++) {
            addToScene(i * 2 - 4, j * -2 + 1, 0, i * 3 + j);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    render();
    controls.update();
    scene.simulate();
};

//code from https://stackoverflow.com/questions/35032257/convert-mouse-click-to-3d-space-with-orthographic-camera
function onMouseDown(event) {
    // calculate mouse position in normalized device coordinates 
    // (-1 to +1) for both components 
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    rendermd();
}

//loads objects in at position x, y, z. 
function addToScene(x, y, z, index) {
    loader.load("./models/" + objectnames[index] + ".json", function(geometry, material) {
        //smesh = new Physijs.BoxMesh(geometry, new THREE.MeshStandardMaterial()); //rainbow 
        mesh = new Physijs.BoxMesh(geometry, material); //original
        mesh.scale.set(.5, .5, .5)
        mesh.position.x = x;
        mesh.position.y = y;
        mesh.castShadow = true;
        mesh.mass = 1000;
        mesh.userData.id = "breakable";
        objects[index] = mesh;
        scene.add(mesh);
    });
}

//loads cell fractured version of object. 
function addToSceneBroken(x, y, z, name) {
    var brokenloader = new THREE.ObjectLoader();
    brokenloader.load("./models/" + name + "broken.json", function(loaded) {
        while (loaded.children.length > 0) //go through each element of the scene 
        {
            var child = loaded.children.pop();
            mesh = new Physijs.BoxMesh(child.geometry, child.material) //original
            //mesh = new Physijs.BoxMesh(child.geometry, new THREE.MeshStandardMaterial()); //rainbow
            mesh.scale.set(.5, .5, .5);
            mesh.position.x = x - child.position.x;
            mesh.position.y = y - child.position.y;
            mesh.position.z = - child.position.z; 
            mesh.userData.id = "unbreakable";
            mesh.castShadow = true;
            scene.add(mesh);
            mesh.applyCentralImpulse(new THREE.Vector3(0, 0, -15));
        }
    });
}

//render on mousedown
function rendermd() {
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    // calculate objects intersecting the picking ray var intersects =     
    var intersects = raycaster.intersectObjects(scene.children);
    var clicked = intersects[0].object;
    if (clicked.mass != 0) {
        var i = (clicked.position.x + 4) / 2;
        var j = (clicked.position.y - 1) / -2;
        var index = Math.floor(i * 3 + j + .5);
        if (clicked.userData.id == "breakable" && !unclickable) {
            scene.remove(clicked);
            objects[index] = null;
            addToSceneBroken(clicked.position.x, clicked.position.y, clicked.position.z, objectnames[index]);
            progress();
        }
        if (clicked.userData.id == "unbreakable") {
            clicked.applyCentralImpulse(new THREE.Vector3(0, 0, -15));
        }
    }
    render();
}

function render() {
    renderer.render(scene, camera);
}

//text progression 
function progress() {
    numbroken++;
    var loader = new THREE.FontLoader();
    switch (numbroken) {
        case 1:
            updateText("...", "choose something that you really, really hate.");
            break;
        case 2:
            updateText("why do you hate me?", "now choose something you love.");
            break;
        case 3:
            updateText("why didn't you protect me?", "do you love anything else?");
            break;
        case 4:
            updateText("was it really love?", "choose something that reminds you of your mother.");
            break;
        case 5:
            updateText("was i too ____?", "choose something that reminds you of your father.");
            break;
        case 6:
            updateText("did i forget to ____?", "choose something you would like as a gift.");
            break;
        case 7:
            updateText("you like me because ____.", "choose something funny.");
            break;
        case 8:
            updateText("why did i make you smile?", "blink five times rapidly and choose the first thing you see.");
            break;
        case 9:
            updateText("why did you see me?", "choose something that fills you with sadness.");
            break;
        case 10:
            updateText("im sorry.", "choose something for the sake of choosing something.");
            break;
        case 11:
            updateText("why me?", "choose something for a person you love");
            break;
        case 12:
            updateText("my true feelings are ____.", "choose the most desirable thing you see.");
            break;
        case 13:
            updateText("...", "choose one more thing.");
            break;
        case 14:
            unclickable = true;
            setTimeout(function() {
                endscreen();
            }, 2000);
    }
}

//switch in camera after the second to last object falls
function endscreen() {
    updateText("", "here is your choice. are you happy with it?");
    var last = null;
    for (var i = 0; i < objects.length; i++) {
        if (objects[i] != null)
            last = objects[i];
    }
    last.applyCentralImpulse(new THREE.Vector3(0, 0, -100));
    $("#whitescreen").fadeIn("slow");
    setTimeout(function() {
        $("#whitescreen").fadeOut("slow");
        scene.remove(last);
        last.scale.set(1, 1, 1);
        last.position.set(0, -14, 0);
        last.userData.id = "unbreakable";
        scene.add(last);
        camera.position.set(1, -15, 1);
        camera.zoom = 3;
        controls.target = new THREE.Vector3(0, -19, 0);
        controls.maxPolarAngle = Math.PI / 2;
        unclickable = false;
        controls.update();
    }, 1000);
}

//gives 3 seconds of text1, then switches to text2
function updateText(small, big) {
    unclickable = true;
    document.getElementById("text2").innerHTML = small;
    $("#text1").fadeOut("slow");
     setTimeout(function() {
        $("#text2").fadeIn("slow");
        setTimeout(function() {
            document.getElementById("text1").innerHTML = big;
            $("#text1").fadeIn("slow");
            $("#text2").fadeOut("slow");
            unclickable = false;
        }, 1500); 
     }, 500); 
}
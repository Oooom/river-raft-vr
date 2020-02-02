var renderer = new THREE.WebGLRenderer({ canvas: area });
renderer.setSize(WIDTH, HEIGHT)

var scene = new THREE.Scene();
// scene.background = new THREE.CubeTextureLoader()
//     .setPath('textures/cubeMaps/')
//     .load([
//         'dark-s_px.jpg',
//         'dark-s_nx.jpg',
//         'dark-s_py.jpg',
//         'dark-s_ny.jpg',
//         'dark-s_pz.jpg',
//         'dark-s_nz.jpg'
//     ]);


var camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 1, 1000)
scene.add(camera)

var groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide }))
scene.add(groundMesh)
groundMesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)

var waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide }))
scene.add(waterMesh)
waterMesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
waterMesh.position.y = 6


var boxMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
scene.add(boxMesh)

boxMesh.position.set(0, 0, -10)

var controls = new THREE.DeviceOrientationControls(camera, true);
controls.connect();

camera.position.set(0, 4, 20)


// var loader = new THREE.GLTFLoader()

// loader.load('scene.gltf', function(gltf){
//     window.mesh = gltf.scene.children[0].children[0].children[0].children[0].children[0]
    
//     gltf.scene.remove(mesh)

//     scene.add(mesh)

//     mesh.material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("/textures/DefaultMaterial_baseColor.jpeg")})
//     mesh.material.needsUpdate = true
// })
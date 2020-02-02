const express = require('express');
const http = require('http');
var CANNON = require(__dirname + '/cannon.js')
var WebSocketServer = require('websocket').server;


var connections = []

var fluid_density = 3
var acc_gravity = -20
var yAxisVec = new CANNON.Vec3(0, 1, 0)

var groundMaterial = new CANNON.Material("groundMaterial");
var ground_ground_cm = new CANNON.ContactMaterial(groundMaterial, groundMaterial, {
    friction: 0.0,
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 3,
    frictionEquationStiffness: 1e8,
    frictionEquationRegularizationTime: 3,
});

var boats = []
var phy

var user_responses = [false, false]

//cannonjs
function initiatePhysics() {
    var world = new CANNON.World()
    world.gravity.set(0, -8, 0)

    world.addContactMaterial(ground_ground_cm)

    //static objects
    var small_stone2_shape = new CANNON.Sphere(1)
    var small_stone2 = new CANNON.Body({
        shape: small_stone2_shape,
        mass: 0,
        material: groundMaterial
    })
    world.addBody(small_stone2)
    small_stone2.position.set(0.522, -0.184, -3.344)

    var small_stone1_shape = new CANNON.Sphere(1)
    var small_stone1 = new CANNON.Body({
        shape: small_stone1_shape,
        mass: 0,
        material: groundMaterial
    })
    world.addBody(small_stone1)
    small_stone1.position.set(-2.204, -0.184, 1.566)

    var large_stone1_shape = new CANNON.Sphere(1)
    var large_stone1 = new CANNON.Body({
        shape: large_stone1_shape,
        mass: 0,
        material: groundMaterial
    })
    world.addBody(large_stone1)
    large_stone1.position.set(-5.221, 1.382, -1.762)

    var left_boundary_shape = new CANNON.Box(new CANNON.Vec3(34.104 / 2, 1.06 / 2, 1 / 2))
    var left_boundary = new CANNON.Body({
        shape: left_boundary_shape,
        mass: 0,
        material: groundMaterial
    })
    world.addBody(left_boundary)
    left_boundary.position.set(0, -0.941, 12.716)

    var right_boundary_shape = new CANNON.Box(new CANNON.Vec3(34.104 / 2, 1.06 / 2, 1 / 2))
    var right_boundary = new CANNON.Body({
        shape: right_boundary_shape,
        mass: 0,
        material: groundMaterial
    })
    world.addBody(right_boundary)
    right_boundary.position.set(0, 0, -10.91 / 2)

    var groundBody = new CANNON.Body({
        mass: 0,
        material: groundMaterial
    })
    groundBody.addShape(new CANNON.Plane())
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), to_radians(-90))
    world.addBody(groundBody)
    groundBody.position.set(-23.857, -0.23, 0.705)


    var vector = new CANNON.Vec3();

    function step() {

        if(! (user_responses[0] && user_responses[1]) ){
            return
        }

        world.step(1 / 60)

        // waterForce()
        // box.quaternion.toEuler(vector)
        // if(to_degrees(vector.y)<10 || to_degrees(vector.y)>170){
        //     var val = 170
        //     if(to_degrees(vector.y<10))
        //         val = 10
        //     box.quaternion.setFromAxisAngle(yAxisVec, to_radians(val))
        // }

        for (var conn of connections) {
            var obj = {
                type: "tick",
                list: []
            }
            for (var i = 0; i < boats.length; i++) {
                var to_put_obj = {
                    position: {
                        x: boats[i].position.x,
                        y: boats[i].position.y,
                        z: boats[i].position.z
                    },

                    quaternion: {
                        y: boats[i].quaternion.y,
                        z: boats[i].quaternion.z,
                        w: boats[i].quaternion.w,
                        x: boats[i].quaternion.x,
                    },
                    id: i
                }

                obj.list.push(to_put_obj)
            }
            conn.send(JSON.stringify(obj))
        }
    }

    var id
    id = setInterval(step, 4)    

    var moveForwardForce = new CANNON.Vec3()

    var i = 0

    return {
        stop: function () {
            clearInterval(id)
        },
        moveForward: function (alpha, id) {
            // box.quaternion.setFromAxisAngle(yAxisVec, to_radians(alpha - 90))

            moveForwardForce.set(Math.sin(to_radians(alpha)), 0, Math.cos(to_radians(alpha)))
            moveForwardForce.scale(35, moveForwardForce)
            boats[parseInt(id)].applyLocalForce(moveForwardForce, new CANNON.Vec3(0, 0, 0))
        },
        world: world
    }
}


const app = express();
let server = http.createServer(app)


server.listen(3000, function () {
    console.log("Listening on port 3000!")
});

var wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', function (request) {
    var connection = request.accept(null, request.origin);

    if (connections.length > 0) {
        
        connections[0].send(JSON.stringify({
            type: "comp",
            competitorID: 1
        }))        

    
        connection.send(JSON.stringify({
            type: "comp",
            competitorID: 0
        }))
        
    }

    if (boats.length == 0)
        phy = initiatePhysics()

    let i = boats.length

    connection.send(JSON.stringify({
        type: "id",
        id: i
    }))    

    var b = makeBoat(phy.world)
    boats.push(b)

    connections.push(connection)


    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function (message) {
        var data = JSON.parse(message.utf8Data)

        if (data.push_forward) {
            phy.moveForward(data.alpha, data.id)
        }

        if(data.ack){
            user_responses[data.id] = true
        }

    });

    connection.on('close', function (connection) {
        connections.splice(connections.indexOf(connection), 1)
        boats.splice(boats.indexOf(b), 1)
        phy.stop()
    });
});


app.use(express.static(__dirname))

//dependencies
app.get('/', function (req, res) {
    res.send("Hello")
})

function to_radians(deg) {
    return deg * Math.PI / 180
}

function to_degrees(rad) {
    return rad * 180 / Math.PI
}


function makeBoat(world) {
    var boxShape = new CANNON.Box(new CANNON.Vec3(7.650 / 2, 1.4 / 2, 1.347 / 2))
    var box = new CANNON.Body({
        shape: boxShape,
        mass: 5,
        material: groundMaterial
    })
    world.addBody(box)
    box.position.set(14, 1, -1 + boats.length * 8)
    box.quaternion.setFromAxisAngle(yAxisVec, to_radians(90))

    console.log(boats.length)
    return box
}
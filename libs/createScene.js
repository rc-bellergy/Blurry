function setGlobals() {
    pointsPerFrame = 20000;

    cameraPosition = new THREE.Vector3(0, 0, 115);
    cameraFocalDistance = 100;

    minimumLineSize = 0.005;

    bokehStrength = 0.02; 
    focalPowerFunction = 1;
    exposure = 0.009;
    distanceAttenuation = 0.002;

    useBokehTexture = true;
    bokehTexturePath = "assets/bokeh/pentagon2.png";

    backgroundColor[0] *= 0.8;
    backgroundColor[1] *= 0.8;
    backgroundColor[2] *= 0.8;
}

let rand, nrand;
let vec3      = function(x,y,z) { return new THREE.Vector3(x,y,z) };
let lightDir0 = vec3(1, 1, 0.2).normalize();
let lightDir1 = vec3(-1, 1, 0.2).normalize();

function createScene() {
    Utils.setRandomSeed("3926153465010");

    rand  = function() { return Utils.rand(); }; // [0 ... 1]
    nrand = function() { return rand() * 2 - 1; };// [-1 ... 1]

    let box = new THREE.BoxGeometry(20,20,20);
    computeGeometry(box);

    // computeWeb();
    // computeSparkles();
    // animation();
}

function computeGeometry(geometry /* THREE geometry */) {
    let vertex = geometry.vertices;
    let faces = geometry.faces;
    faces.forEach(face => {
        lines.push(
            new Line({
                v1: vec3(vertex[face.a].x, vertex[face.a].y, vertex[face.a].z),
                v2: vec3(vertex[face.b].x, vertex[face.b].y, vertex[face.b].z),
                c1: vec3(5, 5, 5),
                c2: vec3(5, 5, 5),
            }),
            new Line({
                v1: vec3(vertex[face.b].x, vertex[face.b].y, vertex[face.b].z),
                v2: vec3(vertex[face.c].x, vertex[face.c].y, vertex[face.c].z),
                c1: vec3(5, 5, 5),
                c2: vec3(5, 5, 5),
            }),
            new Line({
                v1: vec3(vertex[face.a].x, vertex[face.a].y, vertex[face.a].z),
                v2: vec3(vertex[face.c].x, vertex[face.c].y, vertex[face.c].z),
                c1: vec3(5, 5, 5),
                c2: vec3(5, 5, 5),
            })
        )
    });

}

function computeWeb() { 
    // how many curved lines to draw
    let r2 = 17;
    // how many "straight pieces" to assign to each of these curved lines
    let r1 = 32;
    for (let j = 0; j < r2; j++) {
        for (let i = 0; i < r1; i++) {
            // definining the spherical coordinates of the two vertices of the line we're drawing
            // https://zh.wikipedia.org/wiki/%E7%90%83%E5%BA%A7%E6%A8%99%E7%B3%BB
            let phi1 = j / r2 * Math.PI * 2;
            let theta1 = i / r1 * Math.PI - Math.PI * 0.5;

            let phi2 = j / r2 * Math.PI * 2;
            let theta2 = (i + 1) / r1 * Math.PI - Math.PI * 0.5;

            // twist the sphere
            phi1 += theta1;
            phi2 += theta2;

            // converting spherical coordinates to cartesian
            let x1 = Math.sin(phi1) * Math.cos(theta1);
            let y1 = Math.sin(theta1);
            let z1 = Math.cos(phi1) * Math.cos(theta1);

            let x2 = Math.sin(phi2) * Math.cos(theta2);
            let y2 = Math.sin(theta2);
            let z2 = Math.cos(phi2) * Math.cos(theta2);

            // size of the sphere
            let size1 = 20
            let size2 = 20

            lines.push(
                new Line({
                    v1: vec3(x1, y1, z1).multiplyScalar(size1),
                    v2: vec3(x2, y2, z2).multiplyScalar(size2),
                    c1: vec3(5, 5, 5),
                    c2: vec3(5, 5, 5),
                })
            );
            
        }
    }
    for (let i = 0; i < 4500; i++) {
        let x0 = nrand() * 15;
        let y0 = nrand() * 15;
        let z0 = nrand() * 15;

        // dir will be a random direction in the unit sphere
        let dir = vec3(nrand(), nrand(), nrand()).normalize();
        findIntersectingEdges(vec3(x0, y0, z0), dir);
    }
}

function animation() {
    controls.autoRotate = true;

    camera.position.set(0,200,50);
    anime({
        targets: camera.position,
        z:110,
        y:0,
        duration: 3000,
        easing: 'easeInOutQuad'
    })
    // console.log(camera);
}

function computeSparkles() {
    for(let i = 0; i < 5500; i++) {
        let v0 = vec3(nrand(), nrand(), nrand()).normalize().multiplyScalar(18 + rand() * 65);

        let c = 1.325 * (0.3 + rand() * 0.7);
        let s = 0.125;

        if(rand() > 0.9) {
            c *= 4; 
        }

        let normal1 = v0.clone().normalize();

        let diffuse0  = Math.max(lightDir0.dot(normal1) * 3, 0.15);
        let diffuse1  = Math.max(lightDir1.dot(normal1) * 2, 0.2 );

        let r = diffuse0 + 2 * diffuse1;
        let g = diffuse0 + 0.2 * diffuse1;
        let b = diffuse0;

        lines.push(new Line({
            v1: vec3(v0.x - s, v0.y, v0.z),
            v2: vec3(v0.x + s, v0.y, v0.z),

            c1: vec3(r * c, g * c, b * c),
            c2: vec3(r * c, g * c, b * c),
        }));    
        
        lines.push(new Line({
            v1: vec3(v0.x, v0.y - s, v0.z),
            v2: vec3(v0.x, v0.y + s, v0.z),
    
            c1: vec3(r * c, g * c, b * c),
            c2: vec3(r * c, g * c, b * c),
        }));    
    }
}


function findIntersectingEdges(center, dir) {

    let contactPoints = [];
    for(line of lines) {
        let ires = intersectsPlane(
            center, dir,
            line.v1, line.v2
        );

        if(ires === false) continue;

        contactPoints.push(ires);
    }

    if(contactPoints.length < 2) return;

    let randCpIndex = Math.floor(rand() * contactPoints.length);
    let randCp = contactPoints[randCpIndex];
    
    // lets search the closest contact point from randCp
    let minl = Infinity;
    let minI = -1;
    for(let i = 0; i < contactPoints.length; i++) {

        if(i === randCpIndex) continue;

        let cp2 = contactPoints[i];

        // 3d point in space of randCp
        let v1 = vec3(randCp.x, randCp.y, randCp.z);
        // 3d point in space of the contact point we're testing for proximity
        let v2 = vec3(cp2.x, cp2.y, cp2.z);

        let sv = vec3(v2.x - v1.x, v2.y - v1.y, v2.z - v1.z);
        // "l" holds the euclidean distance between the two contact points
        let l = sv.length();

        // if "l" is smaller than the minimum distance we've registered so far, store this contact point's index as minI
        if(l < minl) { 
            minl = l;
            minI = i;
        }
    }
    
    let cp1 = contactPoints[randCpIndex];
    let cp2 = contactPoints[minI];
    
    lines.push(
        new Line({
            v1: vec3(cp1.x, cp1.y, cp1.z),
            v2: vec3(cp2.x, cp2.y, cp2.z),
            c1: vec3(2,2,2),
            c2: vec3(2,2,2),
        })
    );
}

function intersectsPlane(planePoint, planeNormal, linePoint, linePoint2) {

    let lineDirection = new THREE.Vector3(linePoint2.x - linePoint.x, linePoint2.y - linePoint.y, linePoint2.z - linePoint.z);
    let lineLength = lineDirection.length();
    lineDirection.normalize();

    if (planeNormal.dot(lineDirection) === 0) {
        return false;
    }

    let t = (planeNormal.dot(planePoint) - planeNormal.dot(linePoint)) / planeNormal.dot(lineDirection);
    if (t > lineLength) return false;
    if (t < 0) return false;

    let px = linePoint.x + lineDirection.x * t;
    let py = linePoint.y + lineDirection.y * t;
    let pz = linePoint.z + lineDirection.z * t;

    let planeSize = Infinity; 
    if(vec3(planePoint.x - px, planePoint.y - py, planePoint.z - pz).length() > planeSize) return false;

    return vec3(px, py, pz);
}
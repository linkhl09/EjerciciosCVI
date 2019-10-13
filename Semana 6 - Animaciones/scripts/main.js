//----------------------------------------------------------------------------------
// GL Context
//----------------------------------------------------------------------------------

const canvas = document.querySelector('#glcanvas');
const slider = document.getElementById("speedRange");
const sliderLabel = document.getElementById("speedLabel");
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');


let programInfo = {};
//----------------------------------------------------------------------------------
// General initial values
//----------------------------------------------------------------------------------


// -----OBJECTS-----
/**
 * If we wanna move all the objects.
 */
const  ROOT_POSITION  = [0.0, -0.0, 0.0];

/**
 * Speed rotation of the rotors.
 */
const rotorRotation = 0.2;

/**
 *  Movement of the helicopter each time we push a key.
 */
const mov = 0.5;

// -----CAMERA-----
/**
 * View Matrix (this one moves the camera).
 */
let viewMatrix = mat4.create();

/**
 * Camera configurations
 */
let camera ={
  position: [0.0, 0.0, -50.0],
  iversePosition: vec3.create(),
  pitch:  0,
  yaw:    0,
  roll:   0,
  firstPerson: false,
};

/**
 * Initial settings of the camera.
 */
mat4.translate(viewMatrix, viewMatrix, camera.position);
//mat4.rotate(viewMatrix, viewMatrix, degToRad(15), [1.0,0.0,0.0]);

// -----CURVE----
let curve = {
  lutindex: 0,
  startPoint : [],
  endPoint : [],
  controlPoint1 : [],
  controlPoint2 : [],
};

initCurve();

let cursor = { x: 0, y: 0 };

//-----ANIMATION-----
let chopter = {
  speed: 0.001,
  startTime: 0,
  position: curve.startPoint,
};

let lastTime = 0;
let elapsed = 0;


//----------------------------------------------------------------------------------
// Scene graph
//----------------------------------------------------------------------------------

/**
 * List with all the nodes of the scene graph
 */
let nodesList = [];

  /**
   * Here we define the figures to draw and the transformations that each
   * one needs.
   */
  let mainNode = new Node();
  // If we wanna make general changes, we transform the root of our graph
  mat4.translate(mainNode.localMatrix, mainNode.localMatrix, ROOT_POSITION);

// Just an object rotating.
  let building1 = new Node();
  let building2 = new Node();  
  mat4.translate(building1.localMatrix, building1.localMatrix, [-5.0, -10.0, 5.0]);
  mat4.translate(building2.localMatrix, building2.localMatrix, [5.0, -10.0, -5.0]);
  buffers = initBuffers(createCubeVertices(20, 2, 2.5), gl);
  building1.buffers = buffers;
  building2.buffers = buffers;  
  nodesList.push(building1);
  nodesList.push(building2);

// --------------- Draw Sphere ---------------
  // Represents a basic main cabin.
  let sphereNode = new Node();  
  mat4.translate(sphereNode.localMatrix, sphereNode.localMatrix, chopter.position);
  sphereNode.buffers = initBuffers(createSphereVertices(2, 10, 10), gl);
  nodesList.push(sphereNode);
  
// --------------- Draw Cone ---------------
  // This represents the tail boom
  let coneNode = new Node();
  mat4.translate(coneNode.localMatrix, coneNode.localMatrix, [0.0, 0.0, 0.0]);
  mat4.rotate(coneNode.localMatrix, coneNode.localMatrix, - degToRad(90), [0.0, 0.0, 1.0]);
  coneNode.buffers = initBuffers(createCylinderVertices(1.3, 0.3, 9, 10), gl);
  nodesList.push(coneNode);
  
  let auxSphereNode = new Node();
  mat4.translate(auxSphereNode.localMatrix, auxSphereNode.localMatrix, [9.0,0.0,0.0]);
  auxSphereNode.buffers = initBuffers(createSphereVertices(0.3,10,10), gl);
  nodesList.push(auxSphereNode);

// --------------- Draw Cubes ---------------
  // This is to represent the landing skids
  let cube1Node = new Node();
  let cube2Node = new Node();
  const cubeBuffers = initBuffers(createCubeVertices(0.3, 6, 0.3), gl);
  cube1Node.buffers = cubeBuffers;
  cube2Node.buffers = cubeBuffers;
  // Transformations cube 1
  mat4.translate(cube1Node.localMatrix, cube1Node.localMatrix, [-1.7, -2.5, 1.0]);
  
  // Transformations cube 2
  mat4.translate(cube2Node.localMatrix, cube2Node.localMatrix, [-1.7, -2.5, -1.0]);
  
  nodesList.push(cube1Node);
  nodesList.push(cube2Node);
  
  
// --------------- Draw cylinders ---------------
  const cylBuffers = initBuffers(createCylinderVertices(0.15,0.15,1,10), gl);
 
  // Main rotor mast.
  let mainCylNode = new Node();
  mainCylNode.buffers = cylBuffers;  
  mat4.translate(mainCylNode.localMatrix, mainCylNode.localMatrix, [0.0, 1.8 , 0.0]);

  // Sub rotor mast.
  let subCylNode = new Node();
  subCylNode.buffers = initBuffers(createCylinderVertices(0.15, 0.15, 0.5, 10), gl);
  mat4.rotate(subCylNode.localMatrix, subCylNode.localMatrix, -degToRad(90), [1.0,0.0,0.0]);
  mat4.translate(subCylNode.localMatrix, subCylNode.localMatrix, [9.0, -0.5,0.0]);


  // Sub cylinders. (used for the union of the landing skids).
  let subCyl1Node = new Node();
  subCyl1Node.buffers = cylBuffers;
  mat4.translate(subCyl1Node.localMatrix, subCyl1Node.localMatrix, [0.0, -2.5, 1.0]);
  let subCyl2Node = new Node();
  subCyl2Node.buffers = cylBuffers;
  mat4.translate(subCyl2Node.localMatrix, subCyl2Node.localMatrix, [0.0, -2.5, -1.0]);
  
  nodesList.push(mainCylNode);
  nodesList.push(subCylNode );
  nodesList.push(subCyl1Node);
  nodesList.push(subCyl2Node);
  
  
// --------------- Draw Rotor Blades ---------------
  // Main rotor blade
  const rotorBladeBuffers = initBuffers(createCrossVertices(0.2, 0.5, 3.5), gl);
  let rotorBladeNode = new Node();
  rotorBladeNode.buffers = rotorBladeBuffers;
  mat4.translate(rotorBladeNode.localMatrix, rotorBladeNode.localMatrix, [0.0, 2.7, 0.0]);
 
  nodesList.push(rotorBladeNode);
  
  // Sub rotor blade
  const subRotorBladeBuffers = initBuffers(createCrossVertices(0.2, 0.3, 1.0), gl);
  let subRotorBladeNode = new Node();
  subRotorBladeNode.buffers = subRotorBladeBuffers;
  mat4.rotate(subRotorBladeNode.localMatrix, subRotorBladeNode.localMatrix, degToRad(90), [1.0,0.0,0.0,]);
  mat4.translate(subRotorBladeNode.localMatrix, subRotorBladeNode.localMatrix, [9.0, 0.4, 0.0]);

  nodesList.push(subRotorBladeNode);



// Finally we define the relation between the nodes, and update its matrices.
  sphereNode.setParent(mainNode);
  coneNode.setParent(sphereNode);
  auxSphereNode.setParent(sphereNode);
  cube1Node.setParent(sphereNode);
  cube2Node.setParent(sphereNode);
  mainCylNode.setParent(sphereNode);
  subCylNode.setParent(sphereNode);
  subCyl1Node.setParent(sphereNode);
  subCyl2Node.setParent(sphereNode);
  rotorBladeNode.setParent(sphereNode);
  subRotorBladeNode.setParent(sphereNode);

// Curve points
  vertices = createSphereVertices(0.5, 10, 10);
  let colors = [];
  for(let i = 0; i<vertices.colors; i++)
    colors.concat(RGB(255.0,255.0,255.0), RGB(192.0,192.0,192.0));
  vertices.colors = colors;
  
  pointsBuffers = initBuffers(vertices, gl);
  for(let i = 0; i<1; i+=0.1)
  {
    let cP = curve.curve.get(i); // A point in the curve.
    let actPoint = new Node();
    mat4.translate(actPoint.localMatrix, actPoint.localMatrix, [cP.x, cP.y, cP.z] );
    actPoint.buffers = pointsBuffers;
    nodesList.push(actPoint);
    actPoint.setParent(mainNode);
  }


//----------------------------------------------------------------------------------
// FIGURES CONFIG
//----------------------------------------------------------------------------------
main();


// Start here
function main() 
{
  if (!gl) {
    return;
  }
  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl);

  /**
  * Collect all the info needed to use the shader program.
  * Look up which attributes our shader program is using
  * for aVertexPosition, aVevrtexColor and also
  * look up uniform locations.
  */
  programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };
  
  // This is used to move the chopter with the keyboard.
  document.addEventListener('keydown', function(event){
    // TRANSLATIONS
    if(event.keyCode == 37|| event.keyCode == 65)
      mat4.translate(sphereNode.localMatrix, sphereNode.localMatrix, [-mov,0,0]);// LEFT
    else if(event.keyCode == 38|| event.keyCode == 87 )   
      mat4.translate(sphereNode.localMatrix, sphereNode.localMatrix, [0.0,mov,0.0]);// UP
    else if(event.keyCode == 39|| event.keyCode == 68 )      
      mat4.translate(sphereNode.localMatrix, sphereNode.localMatrix, [mov,0.0,0.0]);// RIGTH
    else if(event.keyCode == 40|| event.keyCode == 83 )      
      mat4.translate(sphereNode.localMatrix, sphereNode.localMatrix, [0.0,-mov,0.0]);// DOWN    
    else if(event.keyCode == 69)
      mat4.translate(sphereNode.localMatrix, sphereNode.localMatrix, [0.0,0.0,mov] );// e
    else if(event.keyCode == 	81)
      mat4.translate(sphereNode.localMatrix, sphereNode.localMatrix, [0.0,0.0,-mov]);// q
    // ROTATIONS
    else if(event.keyCode == 75)
      mat4.rotate(sphereNode.localMatrix, sphereNode.localMatrix, degToRad(10), [1.0,0.0,0.0]); // rot x pos 
    else if(event.keyCode == 73)
      mat4.rotate(sphereNode.localMatrix, sphereNode.localMatrix, -degToRad(10), [1.0,0.0,0.0]); // rot x neg
    else if(event.keyCode == 79)
      mat4.rotate(sphereNode.localMatrix, sphereNode.localMatrix, degToRad(10), [0.0,1.0,0.0]); // rot y pos
    else if(event.keyCode == 85)
      mat4.rotate(sphereNode.localMatrix, sphereNode.localMatrix, -degToRad(10), [0.0,1.0,0.0]); // rot y neg
    else if(event.keyCode == 74)
      mat4.rotate(sphereNode.localMatrix, sphereNode.localMatrix, degToRad(10), [0.0,0.0,1.0]); // rot z pos
    else if(event.keyCode == 76)
      mat4.rotate(sphereNode.localMatrix, sphereNode.localMatrix, -degToRad(10), [0.0,0.0,1.0]); // rot z neg
  });  
  
  //Function that manages the drawing and animation
  tick();
  
}//end_main


/**
 * Draw the scene.
 */
function drawScene( programInfo, deltaTime ) 
{
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  /** 
  *   Create a perspective matrix, a special matrix that is
  *   used to simulate the distortion of perspective in a camera.
  *   Our field of view is 45 degrees, with a width/height
  *   ratio that matches the display size of the canvas
  *   and we only want to see objects between 0.1 units
  *   and 100 units away from the camera.
  */
  const fieldOfView = degToRad(45);   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  
  // Apply continuous rotations.
  //mat4.rotate(mainNode.localMatrix, mainNode.localMatrix, 0.025, [0.0, 1.0, 0.0]);
  //mat4.rotate(cubeNode.localMatrix, cubeNode.localMatrix, 0.025, [1.0, -1.0, 0.5]);
  mat4.rotate(rotorBladeNode.localMatrix,rotorBladeNode.localMatrix, 0.2, [0.0, 1.0, 0.0]);
  mat4.rotate(subRotorBladeNode.localMatrix, subRotorBladeNode.localMatrix, 0.1, [0.0, 1.0, 0.0]);
    
  // Here we calculate the actual position of the chopter and where it must be facing.
  let relativePos = chopter.position / curve.length;
  let point = curve.curve.get(relativePos);
  let derivate = curve.curve.derivative(relativePos);
  sphereNode.localMatrix = mat4.create();
  mat4.translate(sphereNode.localMatrix, sphereNode.localMatrix, [point.x, point.y, point.z]);
  
  let co = derivate.z - point.z;
  let ca = derivate.x - point.x;
  let angle = 0;
  if (derivate.x < point.x)
  {
    angle = degToRad(180) + Math.atan(co/ca);
  }
  else
  {
    angle = degToRad(180) - Math.atan(co/ca);
  }
  mat4.rotate(sphereNode.localMatrix, sphereNode.localMatrix, angle, [0.0, 1.0, 0.0]);
  
  // Always update from the main vertex, no matter which is it.
  mainNode.updateWorldMatrix();
  // The cube follows "another line" in the scene graph, so it's its own father.
  building1.updateWorldMatrix();  
  building2.updateWorldMatrix();
  
  
  if(camera.firstPerson)
  {
    camera.position = [point.x , point.y + 2.1, point.z];
    camera.pitch = 10;
    camera.yaw = angle;
    vec3.negate(camera.position, camera.inversePosition);
    mat4.rotate(viewMatrix, viewMatrix, camera.pitch, [1.0, 0.0, 0.0]);
    mat4.rotate(viewMatrix, viewMatrix, camera.yaw, [0.0, 1.0, 0.0]);
    mat4.translate(viewMatrix, viewMatrix, camera.inversePosition);
  }
  
  /**
   * Here's the drawing programm of the previous defined figures.
   */
  nodesList.forEach( (node) =>{
    const modelViewMatrix = node.worldMatrix;
    
    mat4.multiply(modelViewMatrix, viewMatrix, modelViewMatrix);
    // POSITIONS
    {
      const numComponents = 3;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, node.buffers.position);
      gl.vertexAttribPointer( programInfo.attribLocations.vertexPosition, numComponents, type,
                              normalize, stride, offset );
      gl.enableVertexAttribArray( programInfo.attribLocations.vertexPosition );
    }

    // COLORS
    {
      const numComponents = 4;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, node.buffers.color);
      gl.vertexAttribPointer( programInfo.attribLocations.vertexColor, numComponents, type, 
                             normalize, stride, offset);
      gl.enableVertexAttribArray( programInfo.attribLocations.vertexColor);
    }

    // INDICES
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, node.buffers.indices);

    // Tell WebGL to use our program when drawing

    gl.useProgram(programInfo.program);

    // Set the shader uniforms

    gl.uniformMatrix4fv( programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv( programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    {
      const vertexCount = node.buffers.numVer;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(node.buffers.primitiveType, vertexCount, type, offset);
    }
  });
  // Update the rotation for the next draw
}


//-------------------------------------------------------------------------------------
// View Functions
//-------------------------------------------------------------------------------------

/**
 * Puts the camera position in a general plane.
 */
function button1()
{
  camera.firstPerson = false;
  viewMatrix = mat4.create();
  mat4.translate(viewMatrix, viewMatrix, camera.position);
  //mat4.rotate(viewMatrix, viewMatrix, degToRad(15), [1.0,0.0,0.0]);
}


/**
 * Puts the camera position in from top view.
 */
function button2()
{
  firstPerson = false;
  viewMatrix = mat4.create();
  mat4.translate(viewMatrix, viewMatrix, camera.position);
  mat4.rotate(viewMatrix, viewMatrix, degToRad(90), [1.0,0.0,0.0]);
}


/**
 * Indicates that we need to follow the chopter.
 */
function button3()
{
  viewMatrix = mat4.create();
  firstPerson = true;
}


//-------------------------------------------------------------------------------------
// Animation
//-------------------------------------------------------------------------------------

function animate() 
{
  timeNow = new Date().getTime();
  elapsed = timeNow - lastTime;
  lastTime = timeNow;
}

function tick() 
{
  requestAnimationFrame(tick);
  curve.lutindex ++;
  if (curve.lutindex >= curve.max)
    curve.lutindex = 0;

  chopter.position = chopter.speed*(lastTime - chopter.startTime);
  if (chopter.position > curve.length)
  {
    chopter.position = 0;
    chopter.startTime = lastTime;
  }
  
  chopter.speed = slider.value/100000;
  sliderLabel.innerHTML = 'Speed movement: ('+chopter.speed+'):';
  
  drawScene(programInfo, elapsed);
  animate();
}


//-------------------------------------------------------------------------------------
// Curve functions
//-------------------------------------------------------------------------------------

/**
 * Initialize the curve that the chopter will follow.
 */
function initCurve()
{
  curve.lutindex = 0;
  curve.max = 2000;
  curve.startPoint    = [-10.0, -10.0,  10.0];
  curve.controlPoint1 = [-15.0,  5.0,  -20.0];
  curve.controlPoint2 = [ 15.0, -5.0,   20.0];
  curve.endPoint      = [ 10.0,  10.0, -10.0];
  updateCurve();
}


/**
 * Updates the control points of the curve.
 */
function updateCurve(){
  curve.curve = new Bezier(
    curve.startPoint[0],    curve.startPoint[1],    curve.startPoint[2],
    curve.controlPoint1[0], curve.controlPoint1[1], curve.controlPoint1[2],
    curve.controlPoint2[0], curve.controlPoint2[1], curve.controlPoint2[2],
    curve.endPoint[0],      curve.endPoint[1],      curve.endPoint[2]);
  curve.length = curve.curve.length();
}




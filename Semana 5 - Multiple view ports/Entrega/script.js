//----------------------------------------------------------------------------------
// CONSTRAINTS
//----------------------------------------------------------------------------------

const  LINES          = 0x0001;

const  LINE_LOOP      = 0x0002;

const  LINE_STRIP     = 0x0003;

const  TRIANGLES      = 0x0004;

const  TRIANGLE_STRIP = 0x0005;

const  TRIANGLE_FAN   = 0x0006;

const  ROOT_POSITION  = [0.0, 0.0, 0.0];

const faceColors = [
    //  R    G     B     A
    normRGB(226,  35,   35),
    normRGB(35,   226,  202),
    normRGB(38,   226,  35),
    normRGB(73,   77,   135),
    normRGB(147,  18,  220),
    normRGB(252,  107,  22),
  ];

const rotorRotation = 0.2;

/**
 *  Movement of the helicopter each time we push a key.
 */
const mov = 0.5;

let cameraMatrix = mat4.create();

const ROOT_CAM_POSITION = [0.0, 0.0, -50.0];

mat4.translate(cameraMatrix, cameraMatrix, ROOT_CAM_POSITION);

//----------------------------------------------------------------------------------
// GL Context
//----------------------------------------------------------------------------------

const canvas = document.querySelector('#glcanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

// If we don't have a GL context, give up now
if (!gl) {
  alert('Unable to initialize WebGL. Your browser or machine may not support it.');
}


//-------------------------------------------------------------------------------------
// Scene Graph functions
//-------------------------------------------------------------------------------------

/**
 * Object defined to manage the scene graph.
 * Obtained from: https://webglfundamentals.org/webgl/lessons/webgl-scene-graph.html
 */
let Node = function()
{
  this.children = [];
  this.localMatrix = mat4.create();
  this.worldMatrix = mat4.create();
}

/**
 * Sets the parent of a node.
 */
Node.prototype.setParent = function(parent)
{
  // Remove us from our previous parent.
  if(this.parent)
  {
    let index = this.parent.children.indexOf(this);
    if(index >= 0)
      this.paren.children.splice(index,1);
  }
  if(parent)
    parent.children.push(this);
  this.parent = parent;
};

Node.prototype.updateWorldMatrix = function(parentWorldMatrix)
{
  // Apply changes of the world matrix to the current node.
  if(parentWorldMatrix)
    mat4.multiply(this.worldMatrix, parentWorldMatrix, this.localMatrix);
  else
    mat4.copy(this.worldMatrix, this.localMatrix);
  
  // Apply the changes of the world matrix to the childrens of the current node.
  let worldMatrix = this.worldMatrix;
  this.children.forEach(function(child){
    child.updateWorldMatrix(worldMatrix);
  });
};

/**
 * List with all the nodes of the scene graph
 */
let nodesList = [];

/**
 * Here we define the figures to draw and the transformations that each
 * one needs.
 */

  let mainNode = new Node();
  // If we wanna make general changes, we transform the sphere 'cause it's the root of our graph in this case
  mat4.translate(mainNode.localMatrix, mainNode.localMatrix, ROOT_POSITION);
  
  let cubeNode = new Node();
  cubeNode.buffers = initBuffers(createCubeVertices(2, 2, 2));
  nodesList.push(cubeNode);

// --------------- Draw Sphere ---------------
  // Represents a basic main cabin.
  let sphereNode = new Node();  
  mat4.translate(sphereNode.localMatrix, sphereNode.localMatrix, [7.5,0.0,0.0]);
  sphereNode.buffers = initBuffers(createSphereVertices(2, 10, 10));
  nodesList.push(sphereNode);
  
// --------------- Draw Cone ---------------
  // This represents the tail boom
  let coneNode = new Node();
  mat4.translate(coneNode.localMatrix, coneNode.localMatrix, [0.0, 0.0, 0.0]);
  mat4.rotate(coneNode.localMatrix, coneNode.localMatrix, - degToRad(90), [0.0, 0.0, 1.0]);
  coneNode.buffers = initBuffers(createCylinderVertices(1.3, 0.3, 9, 10));
  nodesList.push(coneNode);
  
  let auxSphereNode = new Node();
  mat4.translate(auxSphereNode.localMatrix, auxSphereNode.localMatrix, [9.0,0.0,0.0]);
  auxSphereNode.buffers = initBuffers(createSphereVertices(0.3,10,10));
  nodesList.push(auxSphereNode);

// --------------- Draw Cubes ---------------
  // This is to represent the landing skids
  let cube1Node = new Node();
  let cube2Node = new Node();
  const cubeBuffers = initBuffers(createCubeVertices(0.3, 6, 0.3));
  cube1Node.buffers = cubeBuffers;
  cube2Node.buffers = cubeBuffers;
  // Transformations cube 1
  mat4.translate(cube1Node.localMatrix, cube1Node.localMatrix, [-1.7, -2.5, 1.0]);
  
  // Transformations cube 2
  mat4.translate(cube2Node.localMatrix, cube2Node.localMatrix, [-1.7, -2.5, -1.0]);
  
  nodesList.push(cube1Node);
  nodesList.push(cube2Node);
  
  
// --------------- Draw cylinders ---------------
  const cylBuffers = initBuffers(createCylinderVertices(0.15,0.15,1,10));
 
  // Main rotor mast.
  let mainCylNode = new Node();
  mainCylNode.buffers = cylBuffers;  
  mat4.translate(mainCylNode.localMatrix, mainCylNode.localMatrix, [0.0, 1.8 , 0.0]);

  // Sub rotor mast.
  let subCylNode = new Node();
  subCylNode.buffers = initBuffers(createCylinderVertices(0.15, 0.15, 0.5, 10));
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
  const rotorBladeBuffers = initBuffers(createCrossVertices(0.2, 0.5, 3.5));
  let rotorBladeNode = new Node();
  rotorBladeNode.buffers = rotorBladeBuffers;
  mat4.translate(rotorBladeNode.localMatrix, rotorBladeNode.localMatrix, [0.0, 2.7, 0.0]);
 
  nodesList.push(rotorBladeNode);
  
  // Sub rotor blade
  const subRotorBladeBuffers = initBuffers(createCrossVertices(0.2, 0.3, 1.0));
  let subRotorBladeNode = new Node();
  subRotorBladeNode.buffers = subRotorBladeBuffers;
  mat4.rotate(subRotorBladeNode.localMatrix, subRotorBladeNode.localMatrix, degToRad(90), [1.0,0.0,0.0,]);
  mat4.translate(subRotorBladeNode.localMatrix, subRotorBladeNode.localMatrix, [9.0, 0.4, 0.0]);

  nodesList.push(subRotorBladeNode);



// Finally we define the relation between the nodes, and update its matrices.

  sphereNode.setParent(mainNode);
  cubeNode.setParent(mainNode);
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


//----------------------------------------------------------------------------------
// FIGURES CONFIG
//----------------------------------------------------------------------------------

main();

document.getElementById('btnWholeScene').addEventListener("click",function(){
    cameraMatrix = mat4.create();
    // Solo modificamos la translación pues el angulo apuntando a la esfera del centro se calcula
    // después con la función lookAt
    mat4.translate(cameraMatrix, cameraMatrix, ROOT_CAM_POSITION);
    console.log("whole");
	});
  document.getElementById('btnTopView').addEventListener("click", function(){
    cameraMatrix = mat4.create();
    mat4.translate(cameraMatrix, cameraMatrix, ROOT_CAM_POSITION);
    mat4.rotate(cameraMatrix, cameraMatrix, degToRad(90), [1.0, 0.0, 0.0]);
    console.log("top");
  });
  document.getElementById('btnFromChopter').addEventListener("click", function(){
    cameraMatrix = mat4.create();
    // Al tener definido nuestro grafo de escena, puedo decirle que aplique las modificaciones que tiene el padre
    // de todas las piezas del helicoptero para que se mueva con este.
    mat4.multiply(cameraMatrix, cameraMatrix, sphereNode.worldMatrix);
  });

// Start here
function main() 
{
  if (!gl) {
    return;
  }
  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram();

  /**
  * Collect all the info needed to use the shader program.
  * Look up which attributes our shader program is using
  * for aVertexPosition, aVevrtexColor and also
  * look up uniform locations.
  */
  const programInfo = {
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
  
  var then = 0;
  // Draw the scene repeatedly
  function render(now) 
  {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
    
    drawScene(programInfo, deltaTime);

    requestAnimationFrame(render);
  }//end_render
  requestAnimationFrame(render);
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


  const fieldOfView = degToRad(45);   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  
  let pMatrix = mat4.create();
  
  mat4.perspective(pMatrix, fieldOfView, aspect, zNear, zFar);
  
  // Get the camera's position from the matrix we computed
  let cameraPosition = [
    cameraMatrix[12],
    cameraMatrix[13],
    cameraMatrix[14],
  ];
  //console.log(cameraPosition);
  // Position of the object we want to see.
  let mainObjPosition = [0, 0, 0];
  
  var up = [0.0, 1.0, 0.0];
  
  //lookAt(out, eye, center, up)
  // eye	  vec3	Position of the viewer
  // center	vec3	Point the viewer is looking at
  // up	    vec3	vec3 pointing up
  // Now we compute the camara matrix.
  //mat4.lookAt(cameraMatrix, cameraPosition, mainObjPosition, up);
  
  let viewMatrix = mat4.create();
  // Make a view from the camera matrix.
  mat4.invert(viewMatrix, cameraMatrix);
  mat4.multiply(pMatrix, pMatrix, cameraMatrix);
  
  // Apply continuous rotations.
  mat4.rotate(mainNode.localMatrix, mainNode.localMatrix, 0.025, [0.0, 1.0, 0.0]);
  mat4.rotate(cubeNode.localMatrix, cubeNode.localMatrix, 0.025, [-1.0, -1.0, 1.0]);
  mat4.rotate(rotorBladeNode.localMatrix,rotorBladeNode.localMatrix, rotorRotation, [0.0, 1.0, 0.0]);
  mat4.rotate(subRotorBladeNode.localMatrix, subRotorBladeNode.localMatrix, rotorRotation, [0.0, 1.0, 0.0]);
    
  
  // Always update from the main vertex, no matter which is it.
  mainNode.updateWorldMatrix();
  
  /**
   * Here's the drawing programm of the previous defined figures.
   */
  nodesList.forEach( (node) =>{
    const modelViewMatrix = node.worldMatrix;
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

    gl.uniformMatrix4fv( programInfo.uniformLocations.projectionMatrix, false, pMatrix);
    gl.uniformMatrix4fv( programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    {
      const vertexCount = node.buffers.numVer;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(node.buffers.primitiveType, vertexCount, type, offset);
    }
  });
}

//-------------------------------------------------------------------------------------
// PRIMITIVES FUNCTIONS
//-------------------------------------------------------------------------------------

/**
 * This function gives me the vertices, colors and index of a cube.
 * The cube is by default on the positive axis, touching the origin.
 * Params:   height:     Height of the cube, 1 by default.
 *           width:      Width of the cube, 1 by default.
 *           depth:      Depth of the cube, 1 by default.
 *
 * Returns:  primitiveType: primitive used for drawing.
 *           numVer:        Number of vertex of the figure.
 *           positions:     Vertices of the figure.
 *           normal:        {Optional} I have no idea what is this for.
 *           colors:        Array with uniform colors for al the vertices.
 *           indices:       Index to create the figure.
 */
function createCubeVertices( height, width, depth )
{
  // If not specified, unit cube by default.)
  height  = height || 1;
  width   = width  || 1;
  depth   = depth  || 1;
  const positions = [
    0 * width, 0 * height, 1 * depth,
    0 * width, 1 * height, 1 * depth,
    1 * width, 0 * height, 1 * depth,
    1 * width, 1 * height, 1 * depth,
    1 * width, 0 * height, 0 * depth,
    1 * width, 1 * height, 0 * depth,
    0 * width, 0 * height, 0 * depth,
    0 * width, 1 * height, 0 * depth,
  ];
  
  const indices = [
    0, 1, 2,    1, 2, 3, // Front Face
    6, 7, 4,    7, 5, 4, // Back Face
    1, 7, 3,    7, 5, 3, // Top Face
    0, 6, 2,    6, 2, 4, // Bottom Face
    0, 1, 7,    7, 6, 0, // Left Face
    2, 3, 4,    3, 4, 5, // Right Face    
  ];
  
  // Cute gray
  var colors = [];
  let j = 5;
  for (let i = 0; i< indices.length; i++)
  {  
    colors = colors.concat(faceColors[j],faceColors[j],faceColors[j]);
    if (j == 0)
      j = 5;
    else
      j --;
  }
  
  return {
    primitiveType:  TRIANGLES,
    numVer:         indices.length,
    positions:      positions,
    colors:         colors,
    indices:        indices,
  };
}

/**
 * This function gives me the vertices, colors and index of a sphere.
 * Params:   radius:             Radius of the sphere.
 *           subdivisionsAxis:   Number of divisions in the horizontal axis.
 *           subdivisionsHeight: Number of divisions in the vertical axis.
 *
 * Returns:  numVer:     Number of vertex of the sphere.
 *           positions:  Vertices of the sphere.
 *           normal:     {Optional} I have no idea what is this for.
 *           colors:     Array with uniform colors for al the vertices.
 *           indices:    Index to create the sphere.
 */
function createSphereVertices( radius, subdivisionsAxis, subdivisionsHeight )
{
  if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) 
    throw Error('subdivisionAxis and subdivisionHeight must be > 0');

  /*
   const startLat  = 0;
   const endLat    = Math.PI;
   const startLong = 0;
   const endLong   = Math.PI * 2;
   const latRange = endLat - startLat;
   const longRange = endLong - startLong;
  */
  /*
   * We are going to generate our sphere by iterating through its
   * spherical coordinates and generating 2 triangles for each quad on a
   * ring of the sphere.
   */
  var positions = [];
  // Generate the individual vertices in our vertex buffer.
  for (let i = 0; i <= subdivisionsHeight; i++) 
  {
    for (let j = 0; j <= subdivisionsAxis; j++) 
    {
      // Generate a vertex based on its spherical coordinates
      const v = i / subdivisionsHeight;
      const phi = Math.PI * v;
      const u = j / subdivisionsAxis;      
      const theta = Math.PI * 2 * u;
      
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const x = cosTheta * sinPhi;
      const y = cosPhi;
      const z = sinTheta * sinPhi;
      const point = [radius*x, radius*y, radius*z];
      positions = positions.concat(point);
    }
  }
  
  const numVertsAround = subdivisionsAxis + 1;
  var indices = [];  
  
  for (let x = 0; x < subdivisionsAxis; x++) 
  {
    for (let y = 0; y < subdivisionsHeight; y++) 
    {
      const p = [
        // Make triangle 1 of quad.
        (y + 0) * numVertsAround + x,
        (y + 0) * numVertsAround + x + 1,
        (y + 1) * numVertsAround + x, 
        // Make triangle 2 of quad.
        (y + 1) * numVertsAround + x,
        (y + 0) * numVertsAround + x + 1,
        (y + 1) * numVertsAround + x + 1
      ];
      indices = indices.concat(p);
    }
  }
  
  var colors = [];
  var j = 5;
  for (let i = 0; i< indices.length; i++)
  {  
    colors = colors.concat(faceColors[j]);
    if (j == 0)
      j = 5;
    else
      j --;
  }
  
  return {
    primitiveType:  TRIANGLES,
    numVer:         indices.length,
    positions:      positions,
    // normal:         normals,
    colors:         colors,
    indices:        indices,
  };
}

/**
 * This function gives me the vertices, colors and index of a cylinder.
 * With its draw around y axis and with the bottom over the xz plane.
 * Params:   radius1:    Radius of the BOTTOM of the cylinder.
 *           radius2:    Radius of the TOP of the cylinder.
 *           sides:      Number of divisions of the circles.
 *
 * Returns:  numVer:     Number of vertex of the figure.
 *           positions:  Vertices of the figure.
 *           normal:     {Optional} I have no idea what is this for.
 *           colors:     Array with uniform colors for al the vertices.
 *           indices:    Index to create the figure.
 */
function createCylinderVertices( radius1, radius2, height, sides )
{
  // If the user doesn't specify triangles, we make a cilinder with 100 sides.
  radius1 = radius1 || 1;
  radius2 = radius2 || 0;
  sides = sides||100;
  if(height)
    height = height;
  else
    height = 1;
  
  var positions = [];
  const advance = 360 / sides;
  var angle = 0;
  while (angle < 361)
  {
    const x1 = radius1 * Math.cos(degToRad(angle)); 
    const z1 = radius1 * Math.sin(degToRad(angle));
    const p1 = [x1, 0, z1];
    
    const x2 = radius2 * Math.cos(degToRad(angle));
    const z2 = radius2 * Math.sin(degToRad(angle));
    const p2 = [x2,  height, z2];
    
    positions = positions.concat(p1);
    positions = positions.concat(p2);
    angle += advance;
  }

  var indices = [];
  angle = 0;
  var i = 0;
  while(angle < 360)
  {
    const triangle  = [  i,  i+1, i+2 ];
    const triangle2 = [ i+1, i+2, i+3 ];
    indices = indices.concat(triangle);
    indices = indices.concat(triangle2);
    i += 2;
    angle += advance;
  }
  
  var colors = [];
  let j = 5;
  for (let i = 0; i< indices.length; i++)
  {  
    colors = colors.concat(faceColors[j],faceColors[j],faceColors[j]);
    if (j == 0)
      j = 5;
    else
      j --;
  }
    
  return {
    primitiveType:  TRIANGLE_STRIP,
    numVer:         indices.length,
    positions:      positions,
    // normal:         normals,
    colors:         colors,
    indices:        indices,
  };
  
}

/**
 * This function gives me the vertices, colors and index of a cross.
 * Params:    height:     The height of the cross.
 *            width:      The width of the cross.
 *            large:      The large of each outgoing of the cross.
 *
 * Returns:   numVer:     Number of vertex of the figure.
 *            positions:  Vertices of the figure.
 *            normal:     {Optional} I have no idea what is this for.
 *            colors:     Array with uniform colors for al the vertices.
 *            indices:    Index to create the figure.
 */
function createCrossVertices( height, width, large )
{
  const baseValue = width/2;
  var positions = [
    // Base
    -(baseValue + large),   0,   -baseValue, 
    -(baseValue + large),   0,    baseValue, 
    -baseValue,             0,    baseValue, 
    -baseValue,             0,    baseValue + large, 
    baseValue,              0,    baseValue + large,  
    baseValue,              0,    baseValue, 
    baseValue + large,      0,    baseValue, 
    baseValue + large,      0,   -baseValue, 
    baseValue,              0,   -baseValue, 
    baseValue,              0,   -(baseValue + large), 
    -baseValue,             0,   -(baseValue + large), 
    -baseValue,             0,   -baseValue,
    
    
    // Top
    -(baseValue + large),   height,   -baseValue, 
    -(baseValue + large),   height,    baseValue, 
    -baseValue,             height,    baseValue, 
    -baseValue,             height,    baseValue + large, 
    baseValue,              height,    baseValue + large,  
    baseValue,              height,    baseValue, 
    baseValue + large,      height,    baseValue, 
    baseValue + large,      height,   -baseValue, 
    baseValue,              height,   -baseValue, 
    baseValue,              height,   -(baseValue + large), 
    -baseValue,             height,   -(baseValue + large), 
    -baseValue,             height,   -baseValue,
    
  ];
  
  var indices = [
    // Bottom Face.
    0,  1,  6,    0,  6,  7,
    2,  3,  4,    2,  4,  5,
    8,  9,  10,   8,  10, 11,
    
    // Top Face.
    12, 13, 18,   12, 18, 19,
    14, 15, 16,   14, 16, 17,
    20, 21, 22,   20, 22, 23,    
    
    // Sides.
    
    0,  1,  12,   1,  12, 13,
    1,  2,  13,   2,  13, 14,
    2,  3,  14,   3,  14, 15,
    3,  4,  15,   4,  15, 16,
    4,  5,  16,   5,  16, 17,
    5,  6,  17,   6,  17, 18,
    6,  7,  18,   7,  18, 19,
    7,  8,  19,   8,  19, 20,
    8,  9,  20,   9,  20, 21,
    9,  10, 21,   10, 21, 22,
    10, 11, 22,   11, 22, 23,
    0,  11, 12,   11, 12, 23,
  ];
  
  var colors = [];
  let j = 5;
  for (let i = 0; i< indices.length; i++)
  {  
    colors = colors.concat(faceColors[j],faceColors[j],faceColors[j]);
    if (j == 0)
      j = 5;
    else
      j --;
  }
  
  return {
    primitiveType:  TRIANGLES,
    numVer:         indices.length,
    positions:      positions,
    // normal:         normals,
    colors:         colors,
    indices:        indices,
  };
}



//-------------------------------------------------------------------------------------
// AUX FUNCTIONS
//-------------------------------------------------------------------------------------

/**
 * Change degrees to rads.
 */
function degToRad(degrees) 
{
	return degrees * Math.PI / 180;
}

/**
 * Normalices an RGB from 0-255 to 0-1
 */ 
function normRGB(R, G, B)
{
  return [R/255, G/255, B/255, 1.0];
}

/**
 * Here we initialize all the buffers needed to draw from the given data.
 * Leaving the program ready to draw.
 * Params:       data:     data with the information to draw.
 */
function initBuffers(data) 
{
  const primitiveType     = data.primitiveType;
  const numVer            = data.numVer;
  const positionBuffer    = createBuffer(data.positions);
  const colorBuffer       = createBuffer(data.colors);  
  const indexBuffer       = createIndexBuffer(  data.indices);
  
  return {
    primitiveType:  primitiveType,
    numVer:         numVer,
    position:       positionBuffer,
    color:          colorBuffer,
    indices:        indexBuffer,
  };
}

/**
 * Creates a buffer from the given array.
 */
function createBuffer(array)
{
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
  return buffer;
}

/**
 *  Creates an index buffer.
 */
function createIndexBuffer(indices)
{
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  return indexBuffer;
}

//-------------------------------------------------------------------------------------
// BASE FUNCTIONS (Needed if we want the program to work)
//-------------------------------------------------------------------------------------

/**
 * Initialize a shader program, so WebGL knows how to draw our data
 */
function initShaderProgram() 
{
  // Vertex shader program
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) 
    {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying lowp vec4 vColor;
    void main(void) 
    {
      gl_FragColor = vColor;
    }
  `;
  const vertexShader = loadShader( gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader( gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) 
    return shaderProgram;
  
  alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
  return null;
}

/**
 * creates a shader of the given type, uploads the source and
 * compiles it.
 */
function loadShader(type, source) 
{
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
    return shader;
  
  alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}
//----------------------------------------------------------------------------------
// GL Context
//----------------------------------------------------------------------------------

const canvas = document.querySelector('#glcanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');


let programInfo = {};

//----------------------------------------------------------------------------------
// General initial values
//----------------------------------------------------------------------------------


// -----OBJECTS-----
/**
 * If we wanna move all the objects.
 */
const  ROOT_POSITION  = [0.0, 0.0, 20.0];

// -----CAMERA-----
/**
 * View Matrix (this one moves the camera).
 */
let viewMatrix = mat4.create();

/**
 * Camera configurations
 */
let camera ={
  position: [0.0, 5.0, -50.0],
  iversePosition: vec3.create(),
  pitch:  degToRad(15),
  yaw:    0,
  roll:   0,
  firstPerson: false,
};

/**
 * Initial settings of the camera.
 */
mat4.translate(viewMatrix, viewMatrix, camera.position);
mat4.rotate(viewMatrix, viewMatrix, camera.pitch, [1.0, 0.0, 0.0]);
mat4.rotate(viewMatrix, viewMatrix, camera.yaw, [0.0, 1.0, 0.0]);
mat4.rotate(viewMatrix, viewMatrix, camera.roll, [0.0, 0.0, 1.0]);


// -----CURVE----
let gbCurve = {
  lutindex: 0,
  startPoint : [],
  endPoint : [],
  controlPoint1 : [],
  controlPoint2 : [],
};

initCurve(gbCurve, [], [], [], []);

//-----ANIMATION-----
/**let chopter = {
  speed: 0.001,
  startTime: 0,
  position: curve.startPoint,
};*/

let lastTime = 0;
let elapsed = 0;

// -----TEXTURES-----
const textures = {
  golfBall: "a",
  grass: "a",
  background: "a",
  club: "a",
};


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

  // ------------ scene ------------
  let sceneNode = new Node();

  let planesVertices = createPlaneVertices(40, 40);
  
  let backgroundNode = new Node();
  backgroundNode.buffers = initBuffers(planesVertices, gl);
  backgroundNode.texture = loadTexture("textures/bg.jpg", gl);
  mat4.translate(backgroundNode.localMatrix, backgroundNode.localMatrix, [-20.0, -2.0, 2.0]);
  nodesList.push(backgroundNode)
  
  let floorNode = new Node();
  let colors = [];
  for(let i = 0; i < planesVertices.colors.length; i++)
  colors = colors.concat(normRGB(176,224,230));
  planesVertices.colors = colors;

  floorNode.buffers = initBuffers(planesVertices, gl);
  mat4.translate(floorNode.localMatrix, floorNode.localMatrix, [-20.0, -0.0, 2.0]);
  mat4.rotate(floorNode.localMatrix, floorNode.localMatrix, degToRad(90), [1.0, 0.0, 0.0]);
  nodesList.push(floorNode);


  // ------------ Cylinder ------------
  const falgColor = normRGB(192,192,192);
  const circleBuffers = initBuffers(createCircleVertices(0.5), gl);

  let fullCylinderNode = new Node();  
  mat4.translate(fullCylinderNode.localMatrix, fullCylinderNode.localMatrix, [10.0, 0.0, 0.0]);
  
  let cylinderNode = new Node();
  cylinderNode.buffers = initBuffers(createCylinderVertices(0.5, 0.5, 10.0), gl);
  nodesList.push(cylinderNode);
  
  let cylinderBaseNode = new Node();
  mat4.rotate(cylinderBaseNode.localMatrix, cylinderBaseNode.localMatrix, degToRad(90), [1.0, 0.0, 0.0]);
  cylinderBaseNode.buffers = circleBuffers;
  nodesList.push(cylinderBaseNode);

  let cylinderTopNode = new Node();
  mat4.translate(cylinderTopNode.localMatrix, cylinderTopNode.localMatrix, [0.0, 10.0, 0.0]);
  mat4.rotate(cylinderTopNode.localMatrix, cylinderTopNode.localMatrix, degToRad(90), [1.0, 0.0, 0.0]);
  cylinderTopNode.buffers = circleBuffers;
  nodesList.push(cylinderTopNode);


  // ------------ Cone ------------
  let fullConeNode = new Node();
  mat4.translate(fullConeNode.localMatrix, fullConeNode.localMatrix, [-10.0, 2.0, 0.0]);
  mat4.rotate(fullConeNode.localMatrix, fullConeNode.localMatrix, degToRad(180), [1.0, 0.0, 0.0]);

  let coneNode = new Node();
  coneNode.buffers = initBuffers(createCylinderVertices(1, 0.0, 2.0), gl);
  nodesList.push(coneNode);

  let coneBaseNode = new Node();
  mat4.rotate(coneBaseNode.localMatrix, coneBaseNode.localMatrix, degToRad(90), [1.0, 0.0, 0.0]);
  coneBaseNode.buffers = initBuffers(createCircleVertices(1), gl);
  nodesList.push(coneBaseNode);

  // ------------ Sphere ------------
  let sphereNode = new Node();
  mat4.translate(sphereNode.localMatrix, sphereNode.localMatrix, [-10.0, 3.0, 0.0]);
  sphereNode.buffers = initBuffers(createSphereVertices(2), gl);
  nodesList.push(sphereNode);


  // ------------ graph ------------
  backgroundNode.setParent(sceneNode);
  floorNode.setParent(sceneNode);

  fullCylinderNode.setParent(mainNode);
  cylinderNode.setParent(fullCylinderNode);
  cylinderBaseNode.setParent(fullCylinderNode);
  cylinderTopNode.setParent(fullCylinderNode);

  fullConeNode.setParent(mainNode);
  coneNode.setParent(fullConeNode);
  coneBaseNode.setParent(fullConeNode);

  sphereNode.setParent(mainNode);


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
      aTextureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      textureLocation: gl.getUniformLocation(shaderProgram, "uSampler"),
    },
  };
  
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

  const fieldOfView = degToRad(45);   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  
  // Continuous rotations
  mat4.rotate(sphereNode.localMatrix, sphereNode.localMatrix, degToRad(-1), [0.0, 0.0, 1.0]);

  // Always update from the main vertex, no matter which is it.
  mainNode.updateWorldMatrix();
  sceneNode.updateWorldMatrix();
  
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
    /**In this case we won't use the colors.
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
    }*/

    // TEXTURE
    {
      let numComponents = 2;
      let type = gl.FLOAT;
      let normalize = false;
      let stride = 0;
      let offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, node.buffers.textCoord);
      gl.vertexAttribPointer(programInfo.attribLocations.aTextureCoord, numComponents , type, normalize, stride, offset);
      gl.enableVertexAttribArray(programInfo.attribLocations.aTextureCoord);
    }

    // INDICES
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, node.buffers.indices);

    // Tell WebGL to use our program when drawing

    gl.useProgram(programInfo.program);

    // Set the shader uniforms

    gl.uniformMatrix4fv( programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv( programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    gl.uniform1i( programInfo.uniformLocations.textureLocation, 0)

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

  drawScene(programInfo, elapsed);
  animate();
}


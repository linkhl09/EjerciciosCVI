//----------------------------------------------------------------------------------
// GL Context
//----------------------------------------------------------------------------------

const canvas = document.querySelector('#glcanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');


let programInfo = {};

let shadowProgramInfo = {};

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

let elapsed = 0;

/**
 * Initial settings of the camera.
 */
mat4.translate(viewMatrix, viewMatrix, camera.position);
mat4.rotate(viewMatrix, viewMatrix, camera.pitch, [1.0, 0.0, 0.0]);
mat4.rotate(viewMatrix, viewMatrix, camera.yaw, [0.0, 1.0, 0.0]);
mat4.rotate(viewMatrix, viewMatrix, camera.roll, [0.0, 0.0, 1.0]);

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

  

  // ------------ Sphere ------------
  let sphereNode = new Node();
  mat4.translate(sphereNode.localMatrix, sphereNode.localMatrix, [-10.0, 3.0, 0.0]);
  sphereNode.buffers = initBuffers(createSphereVertices(2), gl);
  nodesList.push(sphereNode);


  // ------------ graph ------------
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

  const programs = initPrograms(gl);

  const shaderProgram = programs.shaderProgram;

  const shaderShadowProgram = programs.shaderShadowProgram;

  /**
  * Collect all the info needed to use the shader program.
  * Look up which attributes our shader program is using and also
  * look up uniform locations.
  */
  programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      //textureLocation: gl.getUniformLocation(shaderProgram, "uSampler"),
      uShadowSampler: gl.getUniformLocation(shaderProgram, 'uShadowSampler'),
      sunDirectionalVector: gl.getUniformLocation(shaderProgram, 'uSunDirectionalVector'),
      isSun: gl.getUniformLocation(shaderProgram, 'uIsSun'),
      isLightPole: gl.getUniformLocation(shaderProgram, 'uIsLightPole'),
      shadowMapTransformMatrix: gl.getUniformLocation(shaderProgram, 'uShadowMapTransformMatrix'),
      applyShadow: gl.getUniformLocation(shaderProgram, 'uApplyShadow'),
    },
  };
  
  shadowProgramInfo = {
    program : shaderShadowProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderShadowProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderShadowProgram, 'aTextureCoord'),
      vertexNormal: gl.getAttribLocation(shaderShadowProgram, 'aVertexNormal'),
    },
    uniformLocations:{
      projectionMatrix: gl.getUniformLocation(shaderShadowProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderShadowProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderShadowProgram, 'uNormalMatrix'),
      uShadowSampler: gl.getUniformLocation(shaderShadowProgram, 'uShadowSampler'),
      sunDirectionalVector: gl.getUniformLocation(shaderShadowProgram, 'uSunDirectionalVector'),
      isSun: gl.getUniformLocation(shaderShadowProgram, 'uIsSun'),
      isLightPole: gl.getUniformLocation(shaderShadowProgram, 'uIsLightPole'),
      shadowMapTransformMatrix: gl.getUniformLocation(shaderShadowProgram, 'uShadowMapTransformMatrix'),
      applyShadow: gl.getUniformLocation(shaderShadowProgram, 'uApplyShadow'),
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
    if(node.buffers.colors !== undefined)
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

    // TEXTURE
    if(node.buffers.textureCoord !== undefined)
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
    gl.uniform1i( programInfo.uniformLocations.textureLocation, 0);

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
}


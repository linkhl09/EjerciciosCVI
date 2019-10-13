main();

//-------------------------------------------------------------------------------------
// GLOBAL VARIABLES
//-------------------------------------------------------------------------------------

var rotation = 0.0;

var vertexCount;

var trianglesCount = 0;

/**
* Radio de parte pegada a la base.
*/
const radius1 = 1.0;

/**
* Radio de parte superior.
*/
const radius2 = 1.5;

//-------------------------------------------------------------------------------------
// FUNCTIONS
//-------------------------------------------------------------------------------------
function main() 
{
  rotation = 0.0;
  const canvas = document.querySelector('#glCanvas');
  // Initialize the GL context
  const gl = canvas.getContext('webgl');
  if (gl === null) 
  {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }
  // Vertex shader program
  const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying lowp vec4 vColor;

  void main() 
  {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
  }
  `;

  const fsSource = `
  varying lowp vec4 vColor;
  void main(void) 
  {
    gl_FragColor = vColor;
  }
  `;

  // Initialize a shader program; this is where all the lighting for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

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
  
  trianglesCount = parseInt(document.getElementById("triangles").elements[0].value);
  
  if(trianglesCount > 0)
    vertexCount = 6 + trianglesCount * 3;
  else
    vertexCount = 6;  
  
  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  //Used for the loop.
  var then = 0;

  // Draw the scene repeatedly
  function render(now) 
  {
    now *= 0.0005;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

/**
* Here we control the objects we are rendering.
* "positions" makes reference to the geometry of the object we are rendering.
*/
function initBuffers(gl) 
{
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  var positions = [
    //Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,
    -1.0, -1.0, -1.0,
    -1.0, -1.0, -1.0,
  ];

  if(trianglesCount > 0)
  {
    console.log("calculo vertices del circulo");
    var puntosIniciales = [];
    const avance = 360 / trianglesCount;
    var angle = 0;
    while(angle <= 360)
    {
      var x1 = radius1 * Math.cos(angle * Math.PI / 180);
      var z1 = radius1 * Math.sin(angle * Math.PI / 180);
      var arr1 = [x1, -1.0, z1];
      
      var x2 = radius2 * Math.cos(angle * Math.PI / 180);
      var z2 = radius2 * Math.sin(angle * Math.PI / 180);
      var arr2 = [x2,  1.0, z2];
      
      if(angle == 0)
      {
        positions = positions.concat(arr1);
        //positions = positions.concat(arr1);
      }
      positions = positions.concat(arr1);
      positions = positions.concat(arr2);
      angle += avance;
    }
    console.log(positions);
  }
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var colors = [];  
  var color = [];
  for(var j = 0; j < vertexCount; ++j)
  {
    const R = Math.random();
    const G = Math.random();
    const B = Math.random();
    if(j<5)
      color = [1, 1, 1, 0.8];  
    else
      color = [R, G, B, 1.0];
    colors = colors.concat(color);
  }
  
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  
  
  return {
    position: positionBuffer,
    color: colorBuffer,
  };
}

function drawScene(gl, programInfo, buffers, deltaTime) 
{
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fieldOfView = 60 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  const modelViewMatrix = mat4.create();

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [-0.0, 0.0, -6.0]);  // amount to translate
  
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              rotation*0.5,     // amount to rotate in radians
              [0, 0, 0]);       // axis to rotate around (Z)
  
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              rotation * 0.6,// amount to rotate in radians
              [1, 0, 0]);       // axis to rotate around (X)
  
  // Update the rotation for the next draw
  rotation += deltaTime;

  /** 
  * Tell WebGL how to pull out the positions from the position
  * buffer into the vertexPosition attribute.
  */
  {
    const numComponents = 3;  // Since we are drawing in 3D
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0;         // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(
      programInfo.attribLocations.vertexPosition);
  }

  /**
  * Tell WebGL how to pull out the colors from the color buffer
  * into the vertexColor attribute.
  */
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(
      programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix);
  {
    const offset = 0;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

/**
* Initialize a shader program, so WebGL knows how to draw our data
*/
function initShaderProgram(gl, vsSource, fsSource) 
{
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

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
* Creates a shader of the given type, uploads the source and
* compiles it.
*/
function loadShader(gl, type, source) 
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
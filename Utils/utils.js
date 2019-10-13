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

//-------------------------------------------------------------------------------------
// AUX FUNCTIONS
//-------------------------------------------------------------------------------------

/**
 * Here we initialize all the buffers needed to draw from the given data.
 * Leaving the program ready to draw.
 * Params:       data:     data with the information to draw.
 */
function initBuffers(data, gl) 
{
  const primitiveType     = data.primitiveType;
  const numVer            = data.numVer;
  const positionBuffer    = createBuffer(data.positions, gl);
  const colorBuffer       = createBuffer(data.colors, gl);  
  const indexBuffer       = createIndexBuffer(data.indices, gl);
  
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
function createBuffer(array, gl)
{
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
  return buffer;
}

/**
 *  Creates an index buffer.
 */
function createIndexBuffer(indices, gl)
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
function initShaderProgram(gl) 
{
  // Vertex shader program
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uViewMatrix;
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
  const vertexShader = loadShader( gl.VERTEX_SHADER, vsSource, gl);
  const fragmentShader = loadShader( gl.FRAGMENT_SHADER, fsSource, gl);

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
function loadShader(type, source, gl) 
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
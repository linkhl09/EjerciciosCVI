//-------------------------------------------------------------------------------------
// TEXTURES
//-------------------------------------------------------------------------------------

function loadTexture(url, gl)
{
  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // It takes time, so first we load the texture as a point
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(normRGB(0,0,255)));
  // Then, we start loading the texture asynchronously.
  var textureInfo = {
    width: 1,   // we don't know the size until it loads
    height: 1,
    texture: texture,
  };
  let image = new Image();
  image.crossOrigin = "anonymous";
  image.src = url;
  image.addEventListener('load', function()
  {
    textureInfo.width = image.width;
    textureInfo.height = image.height;

    gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
  });

  return texture;
}


//-------------------------------------------------------------------------------------
// Curve functions
//-------------------------------------------------------------------------------------

/**
 * Initialize the curve that the chopter will follow.
 */
function initCurve(curve, startPoint, controlPoint1, controlPoint2, endPoint)
{
  curve.lutindex = 0;
  curve.max = 2000;
  curve.startPoint    = startPoint;
  curve.controlPoint1 = controlPoint1;
  curve.controlPoint2 = controlPoint2;
  curve.endPoint      = endPoint;
  updateCurve(curve);
}

/**
 * Updates the control points of the curve.
 */
function updateCurve(curve)
{
  curve.curve = new Bezier(
    curve.startPoint[0],    curve.startPoint[1],    curve.startPoint[2],
    curve.controlPoint1[0], curve.controlPoint1[1], curve.controlPoint1[2],
    curve.controlPoint2[0], curve.controlPoint2[1], curve.controlPoint2[2],
    curve.endPoint[0],      curve.endPoint[1],      curve.endPoint[2]);
  curve.length = curve.curve.length();
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
  const textureBuffer     = createBuffer(data.textCoord, gl);
  
  return {
    primitiveType:  primitiveType,
    numVer:         numVer,
    position:       positionBuffer,
    textCoord:      textureBuffer,
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
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying vec2 vTextureCoord;

    void main(void) 
    {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      // Pass the texture coordinates to the fs.
      vTextureCoord = aTextureCoord;
    }
  `;

  // Fragment shader program

  const fsSource = `
    precision mediump float;

    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main(void) 
    {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
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
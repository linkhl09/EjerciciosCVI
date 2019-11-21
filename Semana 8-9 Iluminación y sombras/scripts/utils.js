//-------------------------------------------------------------------------------------
// TEXTURES
//-------------------------------------------------------------------------------------

function loadTexture(gl, url, color) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0; 
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array(color);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    width, height, border, srcFormat, srcType,
    pixel);

  const image = new Image();
  image.crossOrigin = '';
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      srcFormat, srcType, image);

    if (Utils.isPowerOf2(image.width) && Utils.isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) 
{
  return (value & (value - 1)) == 0;
}

function createShadowFrameBuffer(gl, width, height) 
{
  let frame_buffer, color_buffer, depth_buffer, status;

  // Check for errors and report appropriate error messages
  function _errors(buffer, buffer_name) {
    let error_name = gl.getError();
    if (!buffer || error_name !== gl.NO_ERROR) {
      window.console.log("Error in _createFrameBufferObject,", buffer_name, "failed; ", error_name);

      // Reclaim any buffers that have already been allocated
      gl.deleteTexture(color_buffer);
      gl.deleteFramebuffer(frame_buffer);

      return true;
    }
    return false;
  }

  // Step 1: Create a frame buffer object
  frame_buffer = gl.createFramebuffer();
  if (_errors(frame_buffer, "frame buffer")) { return null; }

  // Step 2: Create and initialize a texture buffer to hold the colors.
  color_buffer = gl.createTexture();
  if (_errors(color_buffer, "color buffer")) { return null; }
  gl.bindTexture(gl.TEXTURE_2D, color_buffer);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
    gl.RGBA, gl.UNSIGNED_BYTE, null);
  if (_errors(color_buffer, "color buffer allocation")) { return null; }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Step 3: Create and initialize a texture buffer to hold the depth values.
  // Note: the WEBGL_depth_texture extension is required for this to work
  //       and for the gl.DEPTH_COMPONENT texture format to be supported.
  depth_buffer = gl.createTexture();
  if (_errors(depth_buffer, "depth buffer")) { return null; }
  gl.bindTexture(gl.TEXTURE_2D, depth_buffer);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0,
    gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
  if (_errors(depth_buffer, "depth buffer allocation")) { return null; }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Step 4: Attach the specific buffers to the frame buffer.
  gl.bindFramebuffer(gl.FRAMEBUFFER, frame_buffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color_buffer, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth_buffer, 0);
  if (_errors(frame_buffer, "frame buffer")) { return null; }

  // Step 5: Verify that the frame buffer is valid.
  status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    _errors(frame_buffer, "frame buffer status:" + status.toString());
  }

  // Unbind these new objects, which makes the default frame buffer the 
  // target for rendering.
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // Remember key properties of the frame buffer object so they can be
  // used later.
  frame_buffer.color_buffer = color_buffer;
  frame_buffer.depth_buffer = depth_buffer;
  frame_buffer.width = width;
  frame_buffer.height = height;
  return frame_buffer;
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
  const indexBuffer       = createIndexBuffer(data.indices, gl);
  let colorBuffer;
  let textureBuffer;
  if ( data.colors !== undefined)
    colorBuffer           = createBuffer(data.colors, gl);  
  if(data.textureCoord!== undefined)
    textureBuffer     = createBuffer(data.textureCoord, gl);
  
  return {
    primitiveType:  primitiveType,
    numVer:         numVer,
    position:       positionBuffer,
    textureCoord:      textureBuffer,
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
function initPrograms(gl) 
{
  // Vertex shader program
  const vsSource = `

    attribute  vec4 aVertexPosition;
    // Given up with textures, painting with colors as always.
    attribute vec4 aVertexColor;

    // For textures.
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    // for shadows
    uniform mat4 uShadowMapTransformMatrix;

    varying lowp vec4 vColor;


    varying vec2 vTextureCoord;
    varying highp vec4 vTransformedNormal;
    varying vec4 vPosition;
    varying vec4 vVertexRelativeToLight;

    void main(void) 
    {
      vPosition = uModelViewMatrix * aVertexPosition;
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      
      // Colors
      vColor = aVertexColor;
      
      // Pass the texture coordinates to the fs.
      vTextureCoord = aTextureCoord;
      vTransformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
      
      // Shadows
      vVertexRelativeToLight = uShadowMapTransformMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;

  // Fragment shader program

  const fsSource = `
    precision mediump float;

    // Colors
    varying lowp vec4 vColor;

    varying vec2 vTextureCoord;
    varying highp vec4 vTransformedNormal;
    varying vec4 vPosition;
    varying vec4 vVertexRelativeToLight;

    // Shadows
    uniform highp floar uAppyShadow;
    uniform sampler2D uShadowSampler;
    
    // Lighting
    uniform highp float uIsSun;
    uniform vec3 uSunDirectionalVector;
    uniform boll uSunUp;
    uniform vec3 uSunColor;

    bool in_shadow(void)
    {
      vec3 vertex_relative_to_light = vVertexRelativeToLight.xyz / vVertexRelativeToLight.w;
      vertex_relative_to_light = vertex_relative_to_light * 0.5 + 0.5;
      vec4 shadowmap_color = texture2D(uShadowSampler, vertex_relative_to_light.xy);
      float shadowmap_distance = shadowmap_color.r;

      if ( vertex_relative_to_light <= shadowmap_distance + 0.00004)
      {
        return false;
      }
      else
      {
        return true;
      }
    }

    void main(void) 
    {
      float z = gl_FragCoord.z;
      
      // Lighting
      highp vec3 ambientLight = vec3(0.7, 0.7, 0.7);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec4 directionalVector = normalize(uSunDirectionalVector);
      vec3 lightWeighting = ambientLight;

      highp float directional = max(dot( vTransformedNormal.xyz, directionalVector), 0.0);

      if(uIsSun < 0.5)
      {
        if( uSunUp)
        {
          lightWeighting += (directionalLightColor * (directional));
          if( in_shadow() )
          {
            lightWeighting = vec3(0.2, 0.2, 0.2);
          }
        }
      }
      else
      {
        lightWeighting += directionalLightColor;
      }

      gl_FragColor = vec4(lightWeighting, 1.0) * vColor
    }
  `;

  const vsShadowSource = `
    // Vertex shadew 
    precision mediump int;
    precision highp float;

    attribute vec4 aVertexPosition;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uShadowMapTransformMatrix;

    void main()
    {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;

  const fsShadowSource = `
    // Fragment shader program
    precision mediump int;
    precision highp floar;

    void main() 
    {
      float z = gl_FragCoord.z;
      gl_FragColor = vec4(z, 0.0, 0.0, 1.0);
    }
  `;

  // Initialize a shader program. All lighting goes here.
  const shaderProgram = initPrograms(gl, vsSource, fsSource);
  const shaderShadowProgram = initPrograms(gl, vsShadowSource, fsShadowSource);

  return {
    shaderProgram: shaderProgram,
    shaderShadowProgram, shaderShadowProgram,
  };

}

/**
 * creates a shader of the given type, uploads the source and
 * compiles it.
 * @param {*} type shader type.
 * @param {*} source code of webGL for the shader.
 * @param {*} gl Actual instance of webGL.
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

  gl.get  
  console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}


/**
 * Initialize a shader program given the vertex shader and fragment shader WebGL code.
 * @param {*} gl Actual instance of webGl.
 * @param {*} vsSource vertex shader webGL code source.
 * @param {*} fsSource fragment shader webGL code source.
 */
function initPrograms(gl, vsSource, fsSource)
{
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
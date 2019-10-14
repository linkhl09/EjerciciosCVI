//----------------------------------------------------------------------------------
// CONSTRAINTS
//----------------------------------------------------------------------------------

const  LINES          = 0x0001;

const  LINE_LOOP      = 0x0002;

const  LINE_STRIP     = 0x0003;

const  TRIANGLES      = 0x0004;

const  TRIANGLE_STRIP = 0x0005;

const  TRIANGLE_FAN   = 0x0006;

const faceColors = [
    //  R    G     B     A
    normRGB(226,  35,   35),
    normRGB(35,   226,  202),
    normRGB(38,   226,  35),
    normRGB(73,   77,   135),
    normRGB(147,  18,  220),
    normRGB(252,  107,  22),
  ];

//-------------------------------------------------------------------------------------
// PRIMITIVES FUNCTIONS
//-------------------------------------------------------------------------------------

/**
 * This function gives me the vertices, colors and index of a plane.
 * The plane is by default on the positive axis, touching the origin. In the x, y plane.
 * Params:   height:     Height of the plane, 1 by default.
 *           width:      Width of the plane, 1 by default.
 *
 * Returns:  primitiveType: primitive used for drawing.
 *           numVer:        Number of vertex of the figure.
 *           positions:     Vertices of the figure.
 *           textCoord:     Texture coordinates.
 *           colors:        Array with uniform colors for al the vertices.
 *           indices:       Index to create the figure.
 */
function createPlaneVertices( height, width )
{
  // If not specified, unit cube by default.)
  height  = height || 1;
  width   = width  || 1;
  const positions = [
    0 * width, 0 * height, 0, // Left bottom corner
    1 * width, 0 * height, 0, // Right bottom corner
    0 * width, 1 * height, 0, // Left top corner
    1 * width, 1 * height, 0, // Right top corner
  ];

  const textCoord = [
    0 , 0 , 0, // Left bottom corner
    1 , 0 , 0, // Right bottom corner
    0 , 1 , 0, // Left top corner
    1 , 1 , 0, // Right top corner
  ];
  
  const indices = [
    0, 1, 2,
    1, 2, 3,
  ];
  
  let colors = [];
  for (let i = 0; i < indices.length; i ++)
  {
    colors = colors.concat([1.0, 1.0, 1.0, 1.0]);
  }

  return {
    primitiveType: TRIANGLES,
    numVer: indices.length,
    positions: positions,
    textCoord: textCoord,
    colors: colors,
    indices: indices,
  }
}

/**
 * This function gives me the vertices, colors and index of a circle.
 * The circle is by default centered in the origin. In the x, y plane.
 * Params:   radius: radius of the circle.
 *           center: center of the circle.
 *           sides: number of sides of the circle. 100 by default.
 *
 * Returns:  primitiveType: primitive used for drawing.
 *           numVer:        Number of vertex of the figure.
 *           positions:     Vertices of the figure.
 *           textCoord:     Texture coordinates.
 *           colors:        Array with uniform colors for al the vertices.
 *           indices:       Index to create the figure.
 */
function createCircleVertices( radius, center, sides )
{
  // If not specified, unit cube by default.)
  radius  = radius || 1;
  center = center || [0.0, 0.0, 0.0];
  sides = sides || 100;
  
  let positions = center;
  const advance = 360 / sides;
  let angle = 0;
  
  while (angle < 361)
  {
    const x = radius * Math.cos(degToRad(angle)); 
    const y = radius * Math.sin(degToRad(angle));
    const p = [x, y, 0.0];
    positions = positions.concat(p);
    angle += advance;
  }

  let indices = [];
  let i = 1;
  angle = 0;
  while(angle < 361)
  {
    indices = indices.concat(0, i, i + 1 );
    i += 2;
    angle += advance;
  }
  
  let colors = [];
  for (let i = 0; i< indices.length; i++)
  {  
    colors = colors.concat(normRGB(255, 255, 255));
  }
  
  return {
    primitiveType: TRIANGLE_STRIP,
    numVer: indices.length,
    positions: positions,
    colors: colors,
    indices: indices,
  }
}

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
  
  
  let colors = [];
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
  
  subdivisionsAxis = subdivisionsAxis || 50;
  subdivisionsHeight = subdivisionsHeight || 50;
  
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
  height = height || 1;
  
  let positions = [];
  const advance = 360 / sides;
  let angle = 0;
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

  let indices = [];
  angle = 0;
  let i = 0;
  while(angle < 360)
  {
    const triangle  = [  i,  i+1, i+2 ];
    const triangle2 = [ i+1, i+2, i+3 ];
    indices = indices.concat(triangle);
    indices = indices.concat(triangle2);
    i += 2;
    angle += advance;
  }
  
  let colors = [];
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
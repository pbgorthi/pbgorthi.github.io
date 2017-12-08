
/**
 * This code comtains the implementation of Delaunay Triangulation
 * using the algorithm in http://paulbourke.net/papers/triangulate/.
 * I have written the code myself with only one part re-used from 
 * the https://github.com/kaizouman/js-delaunay-effect project,
 * to derive the center of the circum circle and the radius
**/

function Triangle(a, b, c){
  this.a = a
  this.b = b
  this.c = c
}

Triangle.prototype.circumcenter = function(){
  var A = this.b.y - this.a.y;
  var B = this.a.x - this.b.x;
  var abMid = {x: (this.a.x+this.b.x)/2.0, y: (this.a.y+this.b.y)/2.0};
  var C = -B*(abMid.x) + A*(abMid.y);
  var temp = A;
  A = -B;
  B = temp;
  
  var D = this.c.y - this.b.y;
  var E = this.b.x - this.c.x;
  var bcMid = {x: (this.b.x+this.c.x)/2.0, y: (this.b.y+this.c.y)/2.0};
  var F = -E*(bcMid.x) + D*(bcMid.y);
  temp = D;
  D = -E;
  E = temp;

  var determinant = (A*E) - (D*B);
  if(Math.abs(determinant) < 0.000001){
    var minx = Math.min(this.a.x, this.b.x, this.c.x);
    var miny = Math.min(this.a.y, this.b.y, this.c.y);
    var dx   = (Math.max(this.a.x, this.b.x, this.c.x) - minx) * 0.5;
    var dy   = (Math.max(this.a.y, this.b.y, this.c.y) - miny) * 0.5;

    var center_x = minx + dx;
    var center_y = miny + dy;
    var r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    return {x: center_x, y: center_y, r: r};
  }
  else{
    var center_x = ((E*C) - (B*F))/determinant;
    var center_y = ((A*F) - (D*C))/determinant;
    var dx = center_x - this.a.x;
    var dy = center_y - this.a.y;
    var r = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    return {x: center_x, y: center_y, r: r};
  }
}

Triangle.prototype.circumscribespoint = function(p, center){
  var radius = center.r;
  var p_distance = Math.sqrt(Math.pow(p.x-center.x,2)+ Math.pow(p.y-center.y,2));

  if (p_distance > radius){
    return false;
  }
  else {
    return true;
  }
}

Triangle.prototype.draw = function(ctx) {
  ctx.beginPath()
  ctx.moveTo(this.a.x, this.a.y)
  ctx.lineTo(this.b.x, this.b.y)
  ctx.lineTo(this.c.x, this.c.y)
  ctx.closePath()
  ctx.stroke()
}

function compareX(p1, p2) {
  return p1.x - p2.x;
}

function removeDoubleEdges(edges){
  for(c=0; c<edges.length; c++){
    var edge1 = edges[c];
    if(edge1==null)
      continue;
    var foundDoubleEdge = false;
    for(k=c+1; k<edges.length; k++){
      var edge2 = edges[k];
      if(edge2==null)
        continue;
      if((edge1.A.x==edge2.A.x && edge1.A.y==edge2.A.y && edge1.B.x==edge2.B.x && edge1.B.y==edge2.B.y) ||
         (edge1.A.x==edge2.B.x && edge1.A.y==edge2.B.y && edge1.B.x==edge2.A.x && edge1.B.y==edge2.A.y)){
        edges[k] = null;
        foundDoubleEdge = true;
      }
    }
    if(foundDoubleEdge)
      edges[c]=null;
  }

  for(c=edges.length-1; c>=0; c--){
    if(edges[c]==null)
      edges.splice(c, 1);
  }
}

function triangulate(vertices, ctx){
  // sort vertices by x-coordinate
  vertices.sort(compareX)

  var xmin = vertices[0].x;
  var xmax = vertices[(vertices.length-1)].x;
  var ymin = vertices[0].y;
  var ymax = vertices[0].y
  for(i=1; i<vertices.length; i++){
    if(vertices[i].y < ymin)
      ymin = vertices[i].y;
    else if(vertices[i].y > ymax)
      ymax = vertices[i].y;
  }

  // derive vertices of equilateral supertriangle
  var sqrt3 = 1.7320508;
  var dx = xmax - xmin;
  var dy = ymax - ymin;
  var ddx = dx*0.1;
  var ddy = dy*0.1;
  xmin = xmin - ddx;
  xmax = xmax + ddx;
  ymin = ymin - ddx;
  ymax = ymax + ddx;
  dx = dx + (2.0*ddx);
  dy = dy + (2.0*ddy);
  var superTriangle = new Triangle(
    {x: (xmin-(dy*1.0/sqrt3)), y: ymin, __sentinel: true},
    {x: (xmax+(dy*1.0/sqrt3)), y: ymin, __sentinel: true},
    {x: (xmin+xmax)/2.0, y: ymax+(dx*sqrt3/2.0), __sentinel: true}
  );

  // triangles that might still need to be reduced
  var openTriangles = [superTriangle];

  // triangles that are already reduced
  var closedTriangles = [];

  // keep track of edges when a point is within a traingle which can be reduced
  var edges = []
  var i = 0;
  while(i<vertices.length){
    // for each open triangle check if current point is within it's circumcircle
    // if point is within the circum circle, remove triangle from open list and
    // add it's edges to the edges list
    edges.length = 0
    var j = openTriangles.length;
    vertex = vertices[i];
    i++;

    while(j--){
      var center = openTriangles[j].circumcenter();
      var isCircumscribed = openTriangles[j].circumscribespoint(vertex, center);

      // if point is to the right of the triangle's circumcircle, then add the triangle to the closed list
      xAxisDistance = vertex.x - center.x;
      if(dx > 0 && xAxisDistance > center.r){
        closedTriangles.push(openTriangles[j])
        openTriangles.splice(j, 1);
        continue;
      }

      // if point is not circumscribed by the triangle, just continue to next triangle
      if(!isCircumscribed){
        continue;
      }
      // else triangle circumscribes the vertex, add its edges to edges list for reducing
      else{
        edges.push(
          {A: openTriangles[j].a, B: openTriangles[j].b},
          {A: openTriangles[j].b, B: openTriangles[j].c},
          {A: openTriangles[j].c, B: openTriangles[j].a}
        );
        openTriangles.splice(j, 1);
      }
    }

    // remove duplicate edges
    removeDoubleEdges(edges);

    // add a new triangle for each edge
    j = edges.length;
    while(j){
      seg = edges[--j];
      openTriangles.push(new Triangle(seg.A, seg.B, vertex));
    }
  }

  Array.prototype.push.apply(closedTriangles, openTriangles);

  i = closedTriangles.length;
  while(i--)
    if(closedTriangles[i].a.__sentinel ||
       closedTriangles[i].b.__sentinel ||
       closedTriangles[i].c.__sentinel)
      closedTriangles.splice(i, 1);

  // list of Delaunay Triangles
  return closedTriangles;
}

if (typeof module !== 'undefined') {
    module.exports = {
        Triangle: Triangle,
        triangulate: triangulate
    }
}

# Delaunay Triangulation on a Live Video Stream

I have implemented Delaunay Triangulation on a live video stream. The UI has been implemented using HTML5 and JavaScript. Video from a computer’s web cam is processed in real time to determine the corner points using an existing image processing library. The corner points (vertices) are then passed to the Delaunay Triangulation algorithm, which returns a list of the triangles. The project has been deployed to https://pbgorthi.github.io/ for viewing the demo.

## Algorithm

I implemented the Paul Bourke algorithm for deriving the Delaunay Triangulation (http://paulbourke.net/papers/triangulate/) for a set of vertices in a 2D space. The idea behind the algorithm is to enclose the set of points with a super triangle and then iteratively split the super triangle into smaller non-overlapping triangles for each vertex. To do this, the algorithm checks if the vertex is enclosed within a circle circumscribing a triangle in the mesh, and keeps a record of all the triangles that together enclose the vertex. The common edges for these triangles are removed resulting in a polygon shape that encloses the vertex. Each vertex of the enclosing polygon is then connected to the vertex contained within it. This results in a set of non-overlapping triangles connecting all the vertices.

Time Complexity: O(n^1.5)

## Credits:

- UI: https://github.com/kaizouman/js-delaunay-effect/
- Algorithm: http://paulbourke.net/papers/triangulate/
- Image Processing: https://github.com/inspirit/jsfeat/

## Future Work:

1. Use divide and conquer algorithm to improve time complexity to O(n log n)
2. Live Voronoi Diagram

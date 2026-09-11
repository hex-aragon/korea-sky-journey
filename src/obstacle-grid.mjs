/** Static broad phase: each obstacle is registered in every cell it overlaps. */
export class ObstacleGrid {
 constructor(obstacles,cellSize=128){
  this.cellSize=cellSize;this.cells=new Map();
  for(const o of obstacles){
   for(let x=Math.floor((o.x-o.w-16)/cellSize);x<=Math.floor((o.x+o.w+16)/cellSize);x++)
    for(let z=Math.floor((o.z-o.d-16)/cellSize);z<=Math.floor((o.z+o.d+16)/cellSize);z++){
     const key=`${x},${z}`;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(o);
    }
  }
 }
 height(x,z,floor){
  for(const o of this.cells.get(`${Math.floor(x/this.cellSize)},${Math.floor(z/this.cellSize)}`)||[])
   if(Math.abs(x-o.x)<o.w+16&&Math.abs(z-o.z)<o.d+16)floor=Math.max(floor,o.h);
  return floor;
 }
}

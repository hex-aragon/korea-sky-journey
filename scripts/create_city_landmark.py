"""An original tapered Seoul skyscraper, authored in Blender."""
import bpy,math
from pathlib import Path
OUT=Path.cwd()/'public'/'models'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,c,metal,rough):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
glass=material('Architectural blue glazing',(.18,.31,.39),.62,.18);silver=material('Aluminium mullions',(.65,.7,.71),.72,.26);stone=material('Podium stone',(.4,.43,.43),.08,.8)
N=32;RINGS=45;verts=[]
for j in range(RINGS):
 t=j/(RINGS-1);r=15*(1-.58*t**1.55);z=t*185
 for i in range(N):a=2*math.pi*i/N;verts.append((math.cos(a)*r,math.sin(a)*r,z))
faces=[]
for j in range(RINGS-1):
 for i in range(N):faces.append((j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i))
me=bpy.data.meshes.new('Curved tapered tower');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new('Seoul tower glazing',me);bpy.context.collection.objects.link(o);o.data.materials.append(glass)
for p in me.polygons:p.use_smooth=True
for j in range(1,RINGS):
 t=j/(RINGS-1);r=15*(1-.58*t**1.55)+.08
 bpy.ops.mesh.primitive_torus_add(major_segments=32,minor_segments=4,location=(0,0,t*185),major_radius=r,minor_radius=.12);bpy.context.object.data.materials.append(silver)
for i in range(16):
 a=2*math.pi*i/16;cu=bpy.data.curves.new('Facade rib','CURVE');cu.dimensions='3D';cu.bevel_depth=.13;cu.bevel_resolution=1;s=cu.splines.new('POLY');s.points.add(RINGS-1)
 for j,p in enumerate(s.points):t=j/(RINGS-1);r=15*(1-.58*t**1.55)+.12;p.co=(math.cos(a)*r,math.sin(a)*r,t*185,1)
 o=bpy.data.objects.new('Silver vertical rib',cu);bpy.context.collection.objects.link(o);o.data.materials.append(silver)
for angle in [0,math.pi]:
 bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=2,radius2=.2,depth=18,location=(math.cos(angle)*4,0,190));bpy.context.object.data.materials.append(silver)
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,3));o=bpy.context.object;o.scale=(45,36,6);o.data.materials.append(stone)
bpy.ops.export_scene.gltf(filepath=str(OUT/'seoul-tower.glb'),export_format='GLB',export_yup=True,export_apply=True)
print('SEOUL_TOWER_EXPORTED')

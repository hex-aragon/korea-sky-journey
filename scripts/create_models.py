import bpy, math
from mathutils import Vector
from pathlib import Path
OUT=Path.cwd()/'public'/'models'
OUT.mkdir(parents=True,exist_ok=True)
def clear():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,color,metal=0,rough=.5):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
 return m
ivory=material('warm porcelain',(.89,.88,.76)); teal=material('deep ocean',(.08,.3,.34),.2);glass=material('blue glass',(.075,.22,.3),.55,.18);gold=material('gold accents',(.83,.53,.21),.45);stone=material('warm stone',(.65,.62,.53));red=material('vermillion',(.58,.19,.12));roof=material('jade roof',(.13,.29,.27));white=material('tower white',(.88,.88,.81))
def mesh(name,verts,faces,mat):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.data.materials.append(mat);return o
def uv(name,loc,scale,mat):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat)
 for p in o.data.polygons:p.use_smooth=True
 return o
def box(name,loc,scale,mat,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 if bevel:mod=o.modifiers.new('soft edges','BEVEL');mod.width=bevel;mod.segments=2;o.modifiers.new('weighted normals','WEIGHTED_NORMAL')
 return o
def cylinder(name,loc,r,depth,mat,r2=None):
 bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=r,radius2=r if r2 is None else r2,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(mat);return o
def export(name):
 bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',export_yup=True,export_apply=True)
clear()
uv('fuselage',(0,0,0),(1.05,5.8,.85),ivory)
uv('canopy',(0,1.5,.58),(.78,2.1,.7),glass)
# Long tapered wings with a curved airfoil profile and upward tips.
for side in [-1,1]:
 verts=[]
 for x,chord,sweep,up in [(0,2.4,0,.0),(3,2.0,-.5,.1),(9,1.05,-1.3,.45),(13,.45,-1.65,1.05)]:
  for y,z in [(chord/2,0),(0,.22),(-chord/2,0),(0,-.09)]:verts.append((side*x,y+sweep,up+z))
 faces=[(0,1,2,3),(12,15,14,13)]
 for i in range(3):
  for j in range(4):faces.append((i*4+j,i*4+(j+1)%4,(i+1)*4+(j+1)%4,(i+1)*4+j))
 wing=mesh('swept wing',verts,faces,ivory);wing.modifiers.new('weighted normals','WEIGHTED_NORMAL')
 box('wing tip',(side*11.6,-1.5,.82),(2.4,.52,.08),teal)
mesh('vertical tail',[(-.12,-4.6,0),(.12,-4.6,0),(.12,-4.9,3),(-.12,-4.9,3),(-.12,-3.0,0),(.12,-3.0,0)],[(0,1,2,3),(0,3,4),(1,5,2),(3,2,5,4),(0,4,5,1)],teal)
box('tail wing',(0,-4.65,2.7),(6.5,1.0,.12),ivory,.1)
uv('nose accent',(0,5.6,0),(.6,.75,.5),gold)
export('glider')
clear()
cylinder('base',(0,0,3),22,6,stone)
cylinder('tapered shaft',(0,0,73),8,140,white,4)
cylinder('observation deck',(0,0,148),20,13,white,24)
cylinder('panoramic windows',(0,0,160),24,11,glass,22)
cylinder('roof',(0,0,169),24,7,white,12)
cylinder('antenna',(0,0,197),2.6,51,red,.4)
export('namsan')
clear()
box('stone foundation',(0,0,2),(48,36,4),stone)
for x in [-16,0,16]:
 for y in [-11,11]:cylinder('red cedar column',(x,y,10),1.25,16,red)
for h,w,d in [(18,52,40),(28,37,27)]:
 verts=[(-w/2,-d/2,h),(w/2,-d/2,h),(w/2,d/2,h),(-w/2,d/2,h),(-w*.32,-d*.3,h+6),(w*.32,-d*.3,h+6),(w*.32,d*.3,h+6),(-w*.32,d*.3,h+6)]
 mesh('sweeping tiled roof',verts,[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],roof)
box('upper room',(0,0,24),(24,17,7),red)
export('pavilion')
clear()
cylinder('lighthouse base',(0,0,2),14,4,stone)
cylinder('lighthouse',(0,0,34),9,65,white,6)
cylinder('red band',(0,0,38),8,8,red,7.5)
cylinder('gallery',(0,0,68),11,4,white)
cylinder('lantern',(0,0,74),6,10,glass)
cylinder('roof',(0,0,82),9,6,red,0)
export('lighthouse')
print('EXPORTED_FOUR_KOREA_MODELS')

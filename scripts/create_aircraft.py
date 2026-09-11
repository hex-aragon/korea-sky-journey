"""Original sailplane and broadleaf tree assets, authored in Blender."""
import bpy,math,random
from pathlib import Path
from mathutils import Vector
OUT=Path.cwd()/'public'/'models'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,color,rough=.3,metal=.0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
white=mat('Pearlescent composite',(.91,.94,.95),.22,.12);navy=mat('Midnight blue lacquer',(.016,.052,.09),.24,.3);orange=mat('Warm copper trim',(.75,.24,.065),.26,.4);rubber=mat('Rubber',(.018,.021,.027),.8);inside=mat('Cockpit upholstery',(.07,.09,.11),.83);metal=mat('Brushed aluminium',(.42,.48,.5),.3,.8);glass=mat('Smoked blue canopy',(.08,.24,.32),.08,.25);p=glass.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=.55;p.inputs['IOR'].default_value=1.45

def mesh(name,v,f,m):
 me=bpy.data.meshes.new(name);me.from_pydata(v,[],f);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.data.materials.append(m)
 for p in me.polygons:p.use_smooth=True
 return o

def sphere(name,loc,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o

def cube(name,loc,scale,m,b=.03):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if b:q=o.modifiers.new('Precision edge radii','BEVEL');q.width=b;q.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o

def tube(name,points,r,m):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=3;s=cu.splines.new('POLY');s.points.add(len(points)-1)
 for a,p in zip(s.points,points):a.co=(*p,1)
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
# Aerodynamic fuselage: smoothly interpolated elliptical cross sections.
rings=[(-5.4,.055,.08,.45),(-4.4,.15,.17,.3),(-3,.23,.28,.12),(-1.5,.39,.44,0),(0,.59,.57,0),(1,.62,.61,.02),(2,.5,.55,.04),(3,.32,.37,0),(3.8,.025,.03,-.05)]
v=[]
for y,w,h,z in rings:
 for j in range(48):a=2*math.pi*j/48;v.append((math.cos(a)*w,y,z+math.sin(a)*h))
f=[]
for i in range(len(rings)-1):
 for j in range(48):f.append((i*48+j,i*48+(j+1)%48,(i+1)*48+(j+1)%48,(i+1)*48+j))
f += [tuple(range(47,-1,-1)),tuple((len(rings)-1)*48+j for j in range(48))]
o=mesh('Sculpted composite fuselage',v,f,white);q=o.modifiers.new('Continuous surface','SUBSURF');q.levels=2
# NACA-style finite-thickness airfoils, swept tips and dihedral.
def wing(name,span,chord,centerY,centerZ,m):
 for side in [-1,1]:
  v=[];N=32;sections=22
  for i in range(sections):
   u=i/(sections-1);x=span*u;c=chord*(1-.73*u);sweep=-.6*u*u
   for j in range(N*2):
    t=(j if j<=N else 2*N-j)/N;t=(1-math.cos(t*math.pi))/2
    thick=5*.12*c*(.2969*math.sqrt(t)-.126*t-.3516*t*t+.2843*t**3-.1036*t**4)
    v.append((side*x,centerY+c*(.3-t)+sweep,centerZ+.25*u*u+(thick if j<=N else -thick*.6)))
  f=[]
  for i in range(sections-1):
   for j in range(N*2):f.append((i*N*2+j,i*N*2+(j+1)%(N*2),(i+1)*N*2+(j+1)%(N*2),(i+1)*N*2+j))
  o=mesh(name,v,f,m)
  # Fine aileron seams and tapered coloured tip caps.
  tube(name+' aileron seam',[(side*span*u,centerY-chord*(1-.73*u)*.51-.6*u*u,centerZ+.25*u*u+.025) for u in [.5,.6,.7,.8,.9,.98]],.009,navy)
wing('Laminar wing',10.6,1.6,0,.12,white);wing('Horizontal stabilizer',2,1,-4.55,1.85,white)
for side in [-1,1]:
 tube('Copper wing trim',[(side*x,-.65-x*.035,.21+.25*(x/10.6)**2) for x in [8.5,9,9.5,10,10.55]],.045,orange)
 mesh('Uplifted winglet',[(side*10.4,-.78,.37),(side*10.7,-.88,.43),(side*10.8,-1.04,.95),(side*10.57,-.89,1.02)],[(0,1,2,3)],navy)
# Tail fin in a closed, gently tapered form.
v=[(-.08,-5.05,.2),(.08,-5.05,.2),(-.045,-5.2,2),(.045,-5.2,2),(-.07,-3.8,.2),(.07,-3.8,.2),(-.04,-4.5,1.92),(.04,-4.5,1.92)]
mesh('Vertical stabilizer',v,[(0,4,6,2),(1,3,7,5),(0,2,3,1),(2,6,7,3),(4,5,7,6)],navy)
sphere('Cockpit seat',(0,.5,.38),(.4,.58,.24),inside)
cube('Instrument binnacle',(0,1.6,.5),(.76,.25,.4),inside)
for x in [-.22,0,.22]:sphere('Dial',(x,1.44,.56),(.075,.022,.075),metal)
tube('Control stick',[(0,.7,.22),(0,.65,.55)],.035,inside)
sphere('Clear bubble canopy',(0,1.1,.48),(.57,1.42,.6),glass)
for y in [-.22,2.15]:
 tube('Canopy frame',[(math.cos(a)*.54,y,.48+math.sin(a)*.55) for a in [j*math.pi/32 for j in range(33)]],.025,white)
for side in [-1,1]:tube('Canopy sill',[(side*.53,-.18,.5),(side*.56,1.1,.49),(side*.28,2.38,.45)],.025,navy)
sphere('Retracted main wheel',(0,-.6,-.57),(.1,.23,.23),rubber)
# Registration placed on upper wing.
bpy.ops.object.text_add(location=(-6,-.44,.23));o=bpy.context.object;o.name='Wing registration';o.data.body='KOREA';o.data.size=.45;o.data.extrude=.002;o.data.materials.append(navy)
bpy.ops.export_scene.gltf(filepath=str(OUT/'glider.glb'),export_format='GLB',export_yup=True,export_apply=True)
# A broadleaf crown made of irregular lobes: instanced in the game instead of cones.
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
r=random.Random(74);bark=mat('Bark',(.11,.085,.06),.95);leaf=mat('Summer foliage',(.19,.28,.11),.9)
bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=.15,radius2=.065,depth=2.3,location=(0,0,1.15));bpy.context.object.data.materials.append(bark)
for i in range(12):
 a=r.random()*math.tau;d=r.random()*.8;bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=(math.cos(a)*d,math.sin(a)*d,1.6+r.random()*1.2));o=bpy.context.object;o.scale=(.55+r.random()*.45,.55+r.random()*.45,.6+r.random()*.45);o.data.materials.append(leaf)
 for v in o.data.vertices:v.co*=.85+r.random()*.3
 for p in o.data.polygons:p.use_smooth=True
bpy.ops.object.select_all(action='SELECT');bpy.context.view_layer.objects.active=bpy.context.selected_objects[0];bpy.ops.object.join()
bpy.ops.export_scene.gltf(filepath=str(OUT/'broadleaf.glb'),export_format='GLB',export_yup=True,export_apply=True)
print('AIRCRAFT_AND_TREE_EXPORTED')

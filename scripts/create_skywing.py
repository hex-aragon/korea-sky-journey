"""Original sailplane and broadleaf tree assets, authored in Blender."""
import bpy,math,random
from pathlib import Path
from mathutils import Vector
OUT=Path.cwd()/'public'/'models'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,color,rough=.3,metal=.0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
white=mat('Pearlescent composite',(.79,.88,.92),.18,.32);navy=mat('Midnight blue lacquer',(.012,.028,.043),.2,.62);orange=mat('Warm copper trim',(.86,.44,.15),.22,.52);rubber=mat('Rubber',(.018,.021,.027),.8);inside=mat('Cockpit upholstery',(.07,.09,.11),.83);metal=mat('Brushed aluminium',(.42,.48,.5),.3,.8);glass=mat('Panoramic obsidian canopy',(.035,.14,.19),.06,.48);p=glass.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=.22;p.inputs['IOR'].default_value=1.45

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
   u=i/(sections-1);x=span*u;c=chord*(1-.73*u);sweep=-3.3*u**1.35
   for j in range(N*2):
    t=(j if j<=N else 2*N-j)/N;t=(1-math.cos(t*math.pi))/2
    thick=5*.12*c*(.2969*math.sqrt(t)-.126*t-.3516*t*t+.2843*t**3-.1036*t**4)
    v.append((side*x,centerY+c*(.3-t)+sweep,centerZ+.55*u*u+(thick if j<=N else -thick*.6)))
  f=[]
  for i in range(sections-1):
   for j in range(N*2):f.append((i*N*2+j,i*N*2+(j+1)%(N*2),(i+1)*N*2+(j+1)%(N*2),(i+1)*N*2+j))
  o=mesh(name,v,f,m)
  # Fine aileron seams and tapered coloured tip caps.
  tube(name+' aileron seam',[(side*span*u,centerY-chord*(1-.73*u)*.51-3.3*u**1.35,centerZ+.55*u*u+.025) for u in [.5,.6,.7,.8,.9,.98]],.009,navy)
wing('Swept manta wing',12.6,2.8,.2,.1,white)
for side in [-1,1]:
 tube('Copper leading-edge inlay',[(side*12.6*u,.2+2.8*(1-.73*u)*.3-3.3*u**1.35,.17+.55*u*u) for u in [.64,.70,.76,.82,.88,.94,1]],.035,orange)
 mesh('Raked carbon wingtip',[(side*11.7,-2.75,.55),(side*12.65,-3.2,.67),(side*12.95,-3.7,1.65),(side*12.4,-3.2,1.55)],[(0,1,2,3)],navy)
 # Swept butterfly tail surfaces.
 mesh('Butterfly tail',[(side*.24,-3.65,.25),(side*.22,-5.3,.3),(side*2.45,-5.8,2.05),(side*2.6,-5.1,2.2)],[(0,1,2,3)],navy)
 tube('Tail edge trim',[(side*.24,-3.65,.25),(side*2.6,-5.1,2.2)],.04,orange)
 # Twin quiet electric ducted fans, open at both ends with visible stators.
 v=[];f=[];segments=40
 for y,r in [(-1.35,.55),(-1.55,.73),(-2.65,.7),(-2.85,.55)]:
  for i in range(segments):a=i/segments*math.tau;v.append((side*2.35+math.cos(a)*r,y,.35+math.sin(a)*r))
 for j in range(3):
  for i in range(segments):f.append((j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i))
 mesh('Sculpted electric fan nacelle',v,f,white)
 for y in [-1.4,-2.8]:
  bpy.ops.mesh.primitive_torus_add(major_radius=.55,minor_radius=.075,major_segments=40,minor_segments=8,location=(side*2.35,y,.35),rotation=(math.pi/2,0,0));bpy.context.object.data.materials.append(navy)
 sphere('Fan spinner',(side*2.35,-2.81,.35),(.19,.3,.19),metal)
 for i in range(7):
  a=i/7*math.tau;o=cube('Fan stator',(side*2.35+math.sin(a)*.34,-2.75,.35+math.cos(a)*.34),(.1,.05,.4),metal,.01);o.rotation_euler.y=a
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
bpy.ops.object.text_add(location=(-6,-.44,.23));o=bpy.context.object;o.name='Wing registration';o.data.body='B A R A M';o.data.size=.28;o.data.extrude=.002;o.data.materials.append(navy)
bpy.ops.export_scene.gltf(filepath=str(OUT/'skywing.glb'),export_format='GLB',export_yup=True,export_apply=True)
print('SKYWING_EXPORTED')

"""Original game aircraft inspired by public USAF F-16/F-22 silhouette references.
Runs in a separate Blender process. Exports no third-party geometry or textures.
"""
import bpy, math
from pathlib import Path
OUT=Path(__file__).resolve().parents[1]/'public/models'
def mat(name,color,metal=.25,rough=.38):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
def mesh(name,v,f,m):
 data=bpy.data.meshes.new(name);data.from_pydata(v,[],f);data.update();o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);data.materials.append(m);return o
def hull(name,rings,m,sides=32):
 v=[(math.cos(j*math.tau/sides)*w,y,z+math.sin(j*math.tau/sides)*h) for y,w,h,z in rings for j in range(sides)];f=[]
 for i in range(len(rings)-1):
  for j in range(sides):f.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
 f.extend([tuple(range(sides-1,-1,-1)),tuple((len(rings)-1)*sides+j for j in range(sides))]);o=mesh(name,v,f,m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def foil(name,points,m,t=.055):
 n=len(points);v=[(x,y,z+t) for x,y,z in points]+[(x,y,z-t) for x,y,z in points];f=[tuple(range(n)),tuple(range(2*n-1,n-1,-1))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)];o=mesh(name,v,f,m);bevel=o.modifiers.new('Soft machined edge','BEVEL');bevel.width=.02;bevel.segments=2;o.modifiers.new('Face normals','WEIGHTED_NORMAL');return o
def bubble(name,loc,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def line(name,points,m,r=.014):
 data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=r;data.bevel_resolution=1;s=data.splines.new('POLY');s.points.add(len(points)-1)
 for v,p in zip(s.points,points):v.co=(*p,1)
 o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);data.materials.append(m)
def export(name):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.convert(target='MESH');groups={}
 for o in list(bpy.context.scene.objects):
  if o.type=='MESH':groups.setdefault(o.data.materials[0].name,[]).append(o)
 for name2,objects in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name=name2
 bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',export_yup=True,export_apply=True)
 print('EXPORTED',name)
for kind in ['viper','specter']:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 skin=mat('Titanium grey' if kind=='specter' else 'Cloud grey',(.40,.46,.50) if kind=='specter' else (.59,.66,.70),.35)
 edge=mat('Radar edge panels',(.19,.24,.28),.3);dark=mat('Intakes and seams',(.025,.036,.046),.3);glass=mat('Gold tinted canopy',(.22,.18,.085),.85,.14);steel=mat('Exhaust petals',(.19,.20,.22),.9,.25);accent=mat('Identification',(.85,.31,.07) if kind=='viper' else (.60,.70,.74),.3)
 if kind=='viper':
  hull('Slender single engine fuselage',[(10.6,.012,.012,0),(8,.48,.42,0),(5.6,.85,.65,0),(2.3,1.08,.78,0),(-2,1.08,.82,0),(-5.8,.83,.76,0),(-8,.63,.6,0)],skin)
  hull('Radar nose',[(10.63,.01,.01,0),(8.1,.46,.41,0),(7.7,.51,.45,0)],edge)
  hull('Chin intake',[(4.1,.63,.43,-.6),(3.8,.75,.50,-.65),(.5,.92,.55,-.54),(-4,.75,.4,-.45)],skin)
  bubble('Deep intake mouth',(0,4.12,-.59),(.54,.04,.36),dark)
  bubble('Bubble canopy',(0,4.5,.62),(.68,2.35,.78),glass)
  foil('Single vertical fin',[(-.055,-2.8,.68),(-.055,-5.3,3.7),(-.055,-7.4,3.7),(-.055,-7.8,.6)],skin,.08)
  foil('Tail insignia',[(-.145,-5.6,3),(-.145,-5.6,3.6),(-.145,-7.2,3.6),(-.145,-7.25,3)],accent,.008)
  for s in [-1,1]:
   foil('Swept wing',[(s*.8,2.1,.12),(s*5.9,-2.0,.05),(s*5.9,-3.65,.06),(s*1.0,-3.8,.15)],skin)
   foil('Wing edge panel',[(s*1.1,1.75,.19),(s*5.85,-2.02,.12),(s*5.85,-2.3,.12),(s*1.1,1.4,.2)],edge,.01)
   foil('All moving tail',[(s*.7,-4.6,.02),(s*3.7,-6.1,.02),(s*3.65,-8.4,.02),(s*.7,-7.6,.02)],skin)
   foil('Ventral stabilizer',[(s*.6,-5.7,-.4),(s*1.1,-6.4,-1.6),(s*1.2,-7.4,-1.6),(s*.65,-7.5,-.4)],edge)
   line('Control hinge',[(s*1.2,-2.8,.23),(s*5.7,-2.85,.14)],dark)
   line('Canopy sill',[(s*.49,6,.91),(s*.68,4.4,.9),(s*.5,2.7,.86)],edge,.035)
   # Slim, unarmed wingtip pods give a recognisable silhouette.
   o=hull('Wingtip rail',[(.1,.02,.02,0),(-.5,.12,.12,0),(-3.5,.12,.12,0),(-4,.04,.04,0)],edge,16);o.location=(s*5.95,0,.09)
  for y,r in [(-7.7,.7),(-8.2,.62),(-8.6,.58)]:
   bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=.045,major_segments=32,minor_segments=6,location=(0,y,0),rotation=(math.pi/2,0,0));bpy.context.object.data.materials.append(steel)
  bubble('Exhaust cavity',(0,-8.57,0),(.54,.03,.52),dark)
  for i in range(18):
   a=i*math.tau/18;b=a+.13
   mesh('Nozzle petals',[(math.cos(a)*.73,-7.6,math.sin(a)*.7),(math.cos(b)*.73,-7.6,math.sin(b)*.7),(math.cos(b)*.58,-8.7,math.sin(b)*.55),(math.cos(a)*.58,-8.7,math.sin(a)*.55)],[(0,1,2,3)],steel)
 else:
  hull('Blended stealth fuselage',[(10.2,.012,.015,0),(7.5,.7,.33,0),(4.8,1.3,.55,0),(1.5,2,.58,0),(-2.5,2.3,.54,0),(-6.5,1.9,.4,0),(-8.2,1.75,.28,0)],skin,12)
  hull('Faceted nose',[(10.25,.008,.008,0),(8.5,.43,.21,0),(7.7,.66,.3,0)],edge,12)
  bubble('Smoked bubble canopy',(0,4.8,.48),(.7,2.15,.69),glass)
  for s in [-1,1]:
   foil('Diamond wing',[(s*1.4,3.3,.0),(s*7.6,-2.3,.0),(s*6.4,-5.4,.05),(s*2,-4.1,.0)],skin,.1)
   foil('Leading radar seam',[(s*1.6,3.17,.11),(s*7.59,-2.29,.11),(s*7.47,-2.55,.11),(s*1.6,2.8,.11)],edge,.014)
   foil('Tailplane',[(s*1.2,-4.7,.0),(s*4.9,-6.6,.0),(s*4.35,-8.8,.0),(s*1.2,-8,.0)],skin)
   foil('Canted tail fin',[(s*1.55,-3.5,.4),(s*2.8,-5.8,3.0),(s*3.05,-7.8,2.8),(s*1.8,-7.6,.38)],skin)
   foil('Tail radar panel',[(s*2.7,-5.7,2.8),(s*2.8,-5.8,3.04),(s*3.05,-7.8,2.84),(s*2.95,-7.8,2.62)],edge,.018)
   foil('Intake rim',[(s*1.0,3.1,-.1),(s*2.15,1.7,.25),(s*2.05,1.7,-.65),(s*1.0,3.1,-.68)],skin)
   foil('Intake darkness',[(s*1.05,3.08,-.15),(s*2.07,1.73,.17),(s*1.98,1.73,-.56),(s*1.05,3.08,-.6)],dark,.025)
   # Two rectangular nozzles with separate top/bottom heat shield petals.
   for z in [-.28,.28]:
    foil('Rectangular thrust nozzle',[(s*1.2-.58,-7.5,z),(s*1.2+.58,-7.5,z),(s*1.2+.48,-8.8,z*.65),(s*1.2-.48,-8.8,z*.65)],steel,.035)
   foil('Nozzle throat',[(s*1.2-.45,-8.72,-.16),(s*1.2+.45,-8.72,-.16),(s*1.2+.45,-8.72,.16),(s*1.2-.45,-8.72,.16)],dark,.012)
   line('Wing elevon seam',[(s*2.5,-3.2,.16),(s*6.25,-4.6,.16)],dark)
   line('Canopy edge',[(s*.5,6.2,.75),(s*.69,4.7,.74),(s*.5,3.4,.74)],edge,.03)
   for j in range(5):line('Engine upper panel',[(s*.7,-2-j*.6,.59),(s*1.8,-2-j*.6,.49)],edge,.022)
 # Shared surface detail and understated airframe markings.
 for s in [-1,1]:
  for j in range(6):line('Upper access panel',[(s*.5,.6-j*.43,.76 if kind=='viper' else .6),(s*.84,.6-j*.43,.65 if kind=='viper' else .55)],dark,.012)
  bubble('Navigation light',(s*(5.9 if kind=='viper' else 7.5),-2.4,.14),(.09,.14,.06),accent)
  foil('Wing recognition bar',[(s*3.5,-1,.14),(s*4.1,-1.45,.14),(s*4.1,-1.7,.14),(s*3.5,-1.26,.14)],accent,.01)
 export(kind+'.glb')

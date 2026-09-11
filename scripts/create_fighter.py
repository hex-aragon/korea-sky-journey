"""Original twin-engine Kestrel fighter; no third-party model assets."""
import bpy, math
from pathlib import Path
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(n,c,metal=.3):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=.29;return m
pearl=material('Arctic ceramic',(.82,.89,.94));navy=material('Midnight graphite',(.018,.032,.055),.6);orange=material('Rescue vermilion',(1,.12,.025));glass=material('Smoked gold canopy',(.065,.115,.15),.8);steel=material('Titanium exhaust',(.14,.17,.21),.85)
def mesh(n,v,f,m):
 me=bpy.data.meshes.new(n);me.from_pydata(v,[],f);me.update();o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
def body(n,rings,m):
 v=[(math.cos(j*math.tau/32)*w,y,z+math.sin(j*math.tau/32)*h) for y,w,h,z in rings for j in range(32)];f=[]
 for i in range(len(rings)-1):
  for j in range(32):f.append((i*32+j,i*32+(j+1)%32,(i+1)*32+(j+1)%32,(i+1)*32+j))
 f.extend([tuple(range(31,-1,-1)),tuple((len(rings)-1)*32+j for j in range(32))]);o=mesh(n,v,f,m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def sphere(n,loc,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=loc);o=bpy.context.object;o.name=n;o.scale=scale;o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def foil(n,points,m,t=.13):
 v=[(x,y,z+t) for x,y,z in points]+[(x,y,z-t) for x,y,z in points];k=len(points);f=[tuple(range(k)),tuple(range(2*k-1,k-1,-1))]+[(i,(i+1)%k,(i+1)%k+k,i+k) for i in range(k)];return mesh(n,v,f,m)
# Blender +Y maps to glTF -Z, the direction of flight.
body('Needle nose and blended fuselage',[(11,.025,.03,0),(8,.5,.45,0),(5,1.0,.75,0),(2,1.45,.86,0),(-2,1.65,.7,0),(-6,1.3,.65,0),(-8,.9,.4,.05)],pearl)
body('Graphite radome',[(11.08,.01,.01,0),(9.7,.25,.24,0),(8.5,.43,.4,0)],navy)
sphere('Panoramic dark canopy',(0,4.05,.7),(.78,2.65,.78),glass)
for side in [-1,1]:
 foil('Cranked delta wing',[(side*.8,3,.0),(side*7.8,-4.8,.15),(side*7.0,-6.0,.2),(side*1.2,-4.5,0)],pearl)
 foil('Orange wing recognition panel',[(side*5,-2,.16),(side*7.75,-4.8,.31),(side*7,-5.9,.36),(side*5,-4.9,.18)],orange,.018)
 foil('Graphite flap',[(side*1.8,-3.2,.2),(side*5.0,-4.25,.3),(side*5,-5.3,.31),(side*1.8,-4.5,.2)],navy,.015)
 foil('Swept tailplane',[(side*1.1,-5.4,.15),(side*4.3,-8,.2),(side*4,-9,.2),(side*.9,-8,0)],navy)
 foil('Canted vertical stabilizer',[(side*1.35,-3.8,.35),(side*2.3,-6,4.0),(side*2.6,-8,3.7),(side*1.45,-8.1,.4)],navy)
 foil('Orange fin flash',[(side*2.18,-5.92,3.5),(side*2.3,-6,4.02),(side*2.6,-8,3.72),(side*2.55,-8,3.2)],orange,.025)
 o=body('Twin engine nacelle',[(1.6,.75,.65,-.35),(-3,.85,.73,-.32),(-7,.7,.6,-.25),(-8.2,.62,.55,-.25)],pearl);o.location.x=side*1.2
 o=body('Metal exhaust nozzle',[(-7.6,.68,.6,-.25),(-8.4,.57,.51,-.25)],steel);o.location.x=side*1.2
 sphere('Dark engine throat',(side*1.2,-8.42,-.25),(.51,.04,.46),navy)
 foil('Intake shadow',[(side*.7,1.65,-.1),(side*1.8,1.65,-.1),(side*1.8,1.65,-.7),(side*.7,1.65,-.7)],navy,.04)
# High contrast upper spine remains visible against both sea and clouds.
foil('Dorsal contrast stripe',[(-.3,1,.89),(.3,1,.89),(.45,-5,.72),(-.45,-5,.72)],navy,.025)

# Small details change the silhouette and catch the sun without large textures.
def line(name,points,r,m):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2;sp=c.splines.new('POLY');sp.points.add(len(points)-1)
 for v,p in zip(sp.points,points):v.co=(*p,1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
for o in list(bpy.context.scene.objects):
 if o.type=='MESH' and any(n in o.name for n in ['wing','tailplane','stabilizer','fuselage']):
  mod=o.modifiers.new('Machined edge','BEVEL');mod.width=.045;mod.segments=3
  o.modifiers.new('Surface normals','WEIGHTED_NORMAL')
# Metallic petal nozzles around a dark throat, with concentric heat shields.
for side in [-1,1]:
 for y,r in [(-7.78,.69),(-8.19,.64),(-8.48,.56)]:
  bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=.035,major_segments=40,minor_segments=8,location=(side*1.2,y,-.25),rotation=(math.pi/2,0,0));bpy.context.object.name='Exhaust heat shield';bpy.context.object.data.materials.append(steel)
 for i in range(16):
  a=i*math.tau/16;b=a+.135
  mesh('Individual titanium nozzle petal',[(side*1.2+math.cos(a)*.69,-7.8,-.25+math.sin(a)*.61),(side*1.2+math.cos(b)*.69,-7.8,-.25+math.sin(b)*.61),(side*1.2+math.cos(b)*.56,-8.5,-.25+math.sin(b)*.5),(side*1.2+math.cos(a)*.56,-8.5,-.25+math.sin(a)*.5)],[(0,1,2,3)],steel)
 # Thin, continuous control surface seams, leading-edge metal, and fasteners.
 line('Wing leading edge',[(side*1.0,2.8,.17),(side*4,-.25,.23),(side*7.7,-4.8,.28)],.025,steel)
 line('Flaperon hinge',[(side*1.9,-3.1,.23),(side*4,-3.8,.28),(side*6.65,-4.7,.30)],.021,navy)
 for j in range(12):
  u=j/11;sphere('Flush wing rivet',(side*(2+u*4.5),-3.18-u*1.4,.26),(.025,.025,.014),steel)
 for j in range(6):
  foil('Dorsal cooling louvre',[(side*.55,-1.8-j*.24,.81),(side*.95,-1.8-j*.24,.78),(side*.95,-1.92-j*.24,.78),(side*.55,-1.92-j*.24,.81)],navy,.005)
 line('Canopy rail',[(side*.53,6,.93),(side*.78,4,1.0),(side*.59,2,1.0)],.045,steel)
 # Paired recognition lights, integrated at the wing tips.
 m=material('Navigation port' if side<0 else 'Navigation starboard',(1,.015,.008) if side<0 else (.03,.8,.35))
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(*m.diffuse_color[:3],1);bs.inputs['Emission Strength'].default_value=3
 sphere('Wing navigation light',(side*7.68,-4.83,.22),(.105,.15,.09),m)
# Curved canopy bow and HUD glass inside the bubble.
line('Canopy structural bow',[(math.cos(a)*.68,3,.75+math.sin(a)*.68) for a in [i*math.pi/32 for i in range(33)]],.045,navy)
sphere('Ejection seat headrest',(0,3.05,1.0),(.27,.35,.32),navy)
for x in [-.25,.25]:line('Pilot harness',[(x,3.03,.98),(x,3.5,.7)],.04,orange)
# Roundels and a modest registration marking, laid onto the top surface.
for side in [-1,1]:
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.33,depth=.008,location=(side*3.55,-1.3,.17));bpy.context.object.data.materials.append(navy)
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.2,depth=.012,location=(side*3.55,-1.3,.18));bpy.context.object.data.materials.append(pearl)
bpy.ops.object.text_add(location=(-.34,-3.0,.92));o=bpy.context.object;o.name='Airframe registration';o.data.body='K-01';o.data.size=.22;o.data.extrude=.001;o.data.materials.append(navy)
# Merge by material after applying bevels: detailed asset, few draw calls.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.convert(target='MESH')
groups={}
for obj in list(bpy.context.scene.objects):
 if obj.type=='MESH':groups.setdefault(obj.data.materials[0].name if obj.data.materials else 'none',[]).append(obj)
for name,objects in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for obj in objects:obj.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 bpy.ops.object.join();bpy.context.object.name=name

bpy.ops.export_scene.gltf(filepath=str(Path.cwd()/'public/models/fighter.glb'),export_format='GLB',export_yup=True,export_apply=True)
print('FIGHTER_EXPORTED')

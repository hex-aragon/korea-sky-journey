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
bpy.ops.export_scene.gltf(filepath=str(Path.cwd()/'public/models/fighter.glb'),export_format='GLB',export_yup=True,export_apply=True)
print('FIGHTER_EXPORTED')

"""Build local geographic assets from NASA GIBS and Mapzen Terrain Tiles.
Dependencies: pillow, numpy. No account or API key is required.
"""
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlencode
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import math,json
import numpy as np
from PIL import Image
OUT=Path(__file__).resolve().parents[1]/'public'/'geography';OUT.mkdir(parents=True,exist_ok=True)
WEST,SOUTH,EAST,NORTH=124,33,131,40
# Blue Marble is a cloud-free historical mosaic, not live satellite imagery.
params=dict(SERVICE='WMS',REQUEST='GetMap',VERSION='1.1.1',LAYERS='BlueMarble_ShadedRelief_Bathymetry',STYLES='',FORMAT='image/jpeg',SRS='EPSG:4326',BBOX=f'{WEST},{SOUTH},{EAST},{NORTH}',WIDTH=4096,HEIGHT=4096)
url='https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?'+urlencode(params)
img=Image.open(BytesIO(urlopen(url,timeout=60).read())).convert('RGB');img.save(OUT/'korea-satellite.webp',quality=92)
ZOOM=8;N=2**ZOOM
xt=lambda lon:(lon+180)/360*N
yt=lambda lat:(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*N
xmin,xmax=int(xt(WEST)),int(xt(EAST));ymin,ymax=int(yt(NORTH)),int(yt(SOUTH))
canvas=np.zeros(((ymax-ymin+1)*256,(xmax-xmin+1)*256),dtype=np.float32)
def tile(pair):
 x,y=pair;url=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{x}/{y}.png'
 rgb=np.asarray(Image.open(BytesIO(urlopen(url,timeout=40).read())).convert('RGB'),dtype=np.float32)
 return x,y,rgb[:,:,0]*256+rgb[:,:,1]+rgb[:,:,2]/256-32768
with ThreadPoolExecutor(max_workers=5) as pool:
 for x,y,a in pool.map(tile,[(x,y) for y in range(ymin,ymax+1) for x in range(xmin,xmax+1)]):
  canvas[(y-ymin)*256:(y-ymin+1)*256,(x-xmin)*256:(x-xmin+1)*256]=a
size=1025;lon=np.linspace(WEST,EAST,size);lat=np.linspace(NORTH,SOUTH,size)
xs=(lon+180)/360*N*256-xmin*256;ys=(1-np.arcsinh(np.tan(np.radians(lat)))/np.pi)/2*N*256-ymin*256
x0=np.floor(xs).astype(int);y0=np.floor(ys).astype(int);fx=xs-x0;fy=ys-y0
arr=(canvas[y0[:,None],x0[None,:]]*(1-fx)[None,:]+canvas[y0[:,None],x0[None,:]+1]*fx[None,:])*(1-fy)[:,None]+(canvas[y0[:,None]+1,x0[None,:]]*(1-fx)[None,:]+canvas[y0[:,None]+1,x0[None,:]+1]*fx[None,:])*fy[:,None]
np.rint(np.clip(arr,-1000,9000)).astype('<i2').tofile(OUT/'korea-elevation.bin')
(OUT/'metadata.json').write_text(json.dumps(dict(west=WEST,south=SOUTH,east=EAST,north=NORTH,size=size,encoding='int16-le-metres',imagery='NASA Blue Marble via GIBS, historical cloud-free mosaic',terrain='Mapzen Terrain Tiles; global SRTM/GMTED2010 courtesy of USGS; ETOPO1 courtesy of NOAA',verticalScale=.12),indent=2))
print('GEOGRAPHY_READY',img.size,'elevation',float(arr.min()),float(arr.max()),'tiles',(xmax-xmin+1)*(ymax-ymin+1))

export const cities = [
 {id:'seoul',name:'서울',en:'Seoul',region:'서울의 하늘',lat:37.5665,lon:126.978,landmark:'남산타워',desc:'한강을 따라 흐르는 도시의 아침',color:'#d0dcda'},
 {id:'incheon',name:'인천',en:'Incheon',region:'서해',lat:37.4563,lon:126.7052,landmark:'인천대교',desc:'섬과 바다 사이, 긴 다리를 건너',color:'#cbdde2'},
 {id:'taean',name:'태안',en:'Taean',region:'서해',lat:36.7456,lon:126.298,landmark:'안면도 해안',desc:'금빛 해변과 소나무 숲 위를 천천히',color:'#dbd8be'},
 {id:'mokpo',name:'목포',en:'Mokpo',region:'서해에서 남해로',lat:34.8118,lon:126.3922,landmark:'유달산',desc:'다도해의 작은 섬들을 세어보세요',color:'#e4d4bc'},
 {id:'yeosu',name:'여수',en:'Yeosu',region:'남해',lat:34.7604,lon:127.6622,landmark:'돌산대교',desc:'바다를 품은 항구와 붉은 다리',color:'#e3d8c8'},
 {id:'tongyeong',name:'통영',en:'Tongyeong',region:'남해',lat:34.8544,lon:128.4332,landmark:'미륵산 · 한려수도',desc:'겹겹이 펼쳐지는 섬과 푸른 물결',color:'#e0d5c3'},
 {id:'busan',name:'부산',en:'Busan',region:'남해에서 동해로',lat:35.1796,lon:129.0756,landmark:'광안대교',desc:'해변과 빌딩 사이를 가르는 바닷바람',color:'#ccd9df'},
 {id:'pohang',name:'포항',en:'Pohang',region:'동해',lat:36.019,lon:129.3435,landmark:'호미곶 등대',desc:'수평선 너머에서 빛이 오는 곳',color:'#d6ddda'},
 {id:'gangneung',name:'강릉',en:'Gangneung',region:'동해',lat:37.7519,lon:128.8761,landmark:'경포대',desc:'호수와 바다가 나란히 반짝이는 풍경',color:'#e0d9c8'},
 {id:'sokcho',name:'속초',en:'Sokcho',region:'동해',lat:38.207,lon:128.5918,landmark:'설악산',desc:'푸른 바다에서 깊은 산의 품으로',color:'#d7d6c7'},
] as const;
export type City = typeof cities[number];
export function geo(lon:number,lat:number){return {x:(lon-127.4)*2600,z:(37-lat)*3300};}
export const positions=cities.map(c=>({...geo(c.lon,c.lat),y:350}));

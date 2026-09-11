export const aircraftChoices = Object.freeze([
 {id:'kestrel',name:'Kestrel · 쌍발 스포츠',file:'fighter.glb',description:'밝은 도색과 넓은 날개',engines:[[-1.2,-.25,10.7],[1.2,-.25,10.7]],wing:7.4,tail:5.3},
 {id:'viper',name:'Viper · 단발 경전투기',file:'viper.glb',description:'날렵한 동체와 단일 꼬리날개',engines:[[0,0,10.7]],wing:5.95,tail:3.0},
 {id:'specter',name:'Specter · 스텔스형',file:'specter.glb',description:'각진 날개와 쌍발 노즐',engines:[[-1.2,0,10.7],[1.2,0,10.7]],wing:7.4,tail:3.8}
]);
export function aircraftById(id){return aircraftChoices.find(a=>a.id===id);}

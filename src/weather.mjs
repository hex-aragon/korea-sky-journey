export const WEATHER_ENDPOINT='https://api.open-meteo.com/v1/forecast';
export function normalizeWeather(raw, now=Date.now()){
 const c=raw?.current;
 if(!c||![c.temperature_2m,c.cloud_cover,c.wind_speed_10m,c.wind_direction_10m,c.weather_code].every(Number.isFinite)||typeof c.time!=='string')throw new Error('Invalid weather response');
 const observed=Date.parse(c.time+'+09:00');
 if(!Number.isFinite(observed)||Math.abs(now-observed)>3*60*60*1000)throw new Error('Weather observation too old');
 return {temperature:Math.max(-50,Math.min(55,c.temperature_2m)),cloud:Math.max(0,Math.min(100,c.cloud_cover)),wind:Math.max(0,Math.min(150,c.wind_speed_10m)),direction:((c.wind_direction_10m%360)+360)%360,code:c.weather_code,day:c.is_day!==0,time:c.time,live:true};
}
export function weatherName(code){return code<2?'맑음':code<4?'구름 많음':code<50?'안개':code<68?'비':code<78?'눈':code<85?'소나기':code<87?'눈': '뇌우';}
export const demoWeather={temperature:23,cloud:25,wind:9,direction:225,code:1,day:true,time:'',live:false};
export async function fetchWeather(cities,signal){
 const url=new URL(WEATHER_ENDPOINT);url.search=new URLSearchParams({latitude:cities.map(c=>c.lat).join(','),longitude:cities.map(c=>c.lon).join(','),current:'temperature_2m,cloud_cover,wind_speed_10m,wind_direction_10m,weather_code,is_day',timezone:'Asia/Seoul',forecast_days:'1'}).toString();
 const response=await fetch(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw new Error('Weather unavailable');const data=await response.json();const list=Array.isArray(data)?data:[data];if(list.length!==cities.length)throw new Error('Incomplete weather response');return list.map(x=>normalizeWeather(x));
}

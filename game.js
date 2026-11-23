import * as THREE from 'three';
const $=id=>document.getElementById(id),WORLD=128,CHUNK=16,MIN_Y=-4,MAX_Y=32,STORE='blockworld-save-v2';
const info={grass:['Grass','🟩','grass'],dirt:['Dirt','🟫','dirt'],stone:['Stone','⬜','stone'],wood:['Oak log','🪵','wood'],leaves:['Leaves','🌿','leaves'],planks:['Oak planks','🟨','planks'],sand:['Sand','🟨','sand'],coalOre:['Coal ore','⚫','coal'],ironOre:['Iron ore','🟤','ironOre'],water:['Water','🟦',null],bedrock:['Bedrock','⬛',null],cobblestone:['Cobblestone','🪨','cobblestone'],gravel:['Gravel','▫️','gravel'],sandstone:['Sandstone','🟨','sandstone'],brick:['Bricks','🧱','brick'],stoneBrick:['Stone bricks','◻️','stoneBrick'],mossStone:['Mossy stone','🪨','mossStone'],glass:['Glass','🔹','glass'],ice:['Ice','🧊','ice'],snow:['Snow','⬜','snow'],clay:['Clay','🟫','clay'],obsidian:['Obsidian','⬛','obsidian'],sponge:['Sponge','🟨','sponge'],bookshelf:['Bookshelf','📚','bookshelf'],ironBlock:['Iron block','⬜','ironBlock'],goldBlock:['Gold block','🟨','goldBlock'],diamondBlock:['Diamond block','💎','diamondBlock'],redWool:['Red wool','🟥','redWool'],orangeWool:['Orange wool','🟧','orangeWool'],yellowWool:['Yellow wool','🟨','yellowWool'],limeWool:['Lime wool','🟩','limeWool'],greenWool:['Green wool','🟢','greenWool'],cyanWool:['Cyan wool','🩵','cyanWool'],blueWool:['Blue wool','🟦','blueWool'],purpleWool:['Purple wool','🟪','purpleWool'],whiteWool:['White wool','⬜','whiteWool']};
const creativeBlocks=['grass','dirt','stone','cobblestone','wood','leaves','planks','sand','water','gravel','sandstone','brick','stoneBrick','mossStone','glass','ice','clay','obsidian','sponge','bookshelf','ironBlock','goldBlock','diamondBlock','redWool','orangeWool','yellowWool','limeWool','greenWool','cyanWool','blueWool','purpleWool','whiteWool'];
const barItems=['grass','dirt','stone','wood','planks','leaves','sand','water','glass'];
const inventory={grass:32,dirt:32,stone:32,wood:16,planks:12,leaves:10,sand:8,sticks:0,coal:0,ironOre:0,pickaxeTier:0,shovelTier:0};
const packColors={},pressed=Object.create(null),world=new Map(),changes=new Map(),chunks=new Map(),mats={},textures={},slimes=[],clouds=[];
let scene,camera,renderer,sun,hemi,sunOrb,moonOrb,selectionBox,worldObjects=[],selected=0,running=false,locked=false,panel=false;
let yaw=0,pitch=0,last=0,fpsFrames=0,fpsAt=0,clock=0,saveAt=0,fogEnabled=true;
const player={x:0,y:10,z:0,vy:0,grounded:false},ray=new THREE.Raycaster();
const key=(x,y,z)=>x+','+y+','+z,chunk=n=>Math.floor(n/CHUNK),setRaw=(x,y,z,t)=>{const k=key(x,y,z);t==='air'?world.delete(k):world.set(k,t);},get=(x,y,z)=>world.get(key(x,y,z))||'air';
function random(x,z,s=0){let n=Math.imul(x+173,374761393)+Math.imul(z+591,668265263)+Math.imul(s+911,2246822519);n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0;}
function heightAt(x,z){return Math.max(3,Math.min(13,Math.floor(6+Math.sin(x*.105)*2.2+Math.cos(z*.12)*1.9+Math.sin((x+z)*.075)*1.6+Math.cos((x-z)*.045))));}
function texture(name,base,seed,style){
 const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d'),fill=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
 fill(0,0,16,16,'#'+base.toString(16).padStart(6,'0'));
 if(style==='grassTop'){const p=['#58983b','#65a944','#70b34b','#4f8e38','#7bbd51'];for(let y=0;y<16;y++)for(let x=0;x<16;x++)if((x*11+y*7+seed)%5)fill(x,y,1,1,p[(x*3+y*5+seed)%5]);for(let i=0;i<16;i++)fill((i*7+seed)%16,(i*11+3)%16,1,1,'#3f7b31');}
 else if(style==='grassSide'){fill(0,0,16,16,'#805334');for(let i=0;i<52;i++)fill((i*7+seed)%16,(i*11)%16,1,1,i%2?'#95633c':'#70472f');fill(0,0,16,3,'#57983b');fill(0,2,16,1,'#6cac45');for(let x=0;x<16;x++)if((x*7+seed)%5===0)fill(x,3,1,1,'#57983b');}
 else if(style==='dirt'){for(let i=0;i<58;i++)fill((i*7+seed*3)%16,(i*11+seed)%16,1+(i%7===0?1:0),1,i%3===0?'#9a6944':i%3===1?'#6c472e':'#875a38');}
 else if(style==='stone'||style==='coal'||style==='iron'){for(let i=0;i<50;i++)fill((i*9+seed)%16,(i*5+seed*3)%16,1+(i%9===0?1:0),1,i%3===0?'#999da0':i%3===1?'#73797c':'#858b8e');if(style!=='stone'){const ore=style==='coal'?'#30363a':'#c4a17d';for(let i=0;i<13;i++){const x=(i*7+seed*2)%15,y=(i*11+4+seed)%15;fill(x,y,2,2,ore);}}}
 else if(style==='cobble'||style==='stoneBrick'||style==='mossStone'){
  const palette=style==='mossStone'?['#737c6a','#5d6858','#829078','#4d5749']:['#73797b','#8e9494','#62696b','#a0a3a0'];
  for(let y=0,row=0;y<16;y+=4,row++){for(let x=(row%2?-2:0);x<16;x+=6){const xx=(x+16)%16,w=4+(row+Math.floor(x/6))%3;fill(xx,y,w,3,palette[(row+Math.floor(x/6)+2)%palette.length]);fill(xx,y,w,1,palette[0]);}}
  if(style==='stoneBrick'){for(const y of [0,5,10,15])fill(0,y,16,1,'#555d60');for(const x of [7,15]){fill(x,0,1,5,'#555d60');fill((x+8)%16,5,1,5,'#555d60');fill(x,10,1,5,'#555d60');}}
  if(style==='mossStone')for(let i=0;i<22;i++){const x=(i*7+seed)%16,y=(i*11+seed*3)%16;fill(x,y,2,1,i%2?'#477344':'#8aa16c');}
 }
 else if(style==='gravel'){fill(0,0,16,16,'#99958a');for(let i=0;i<86;i++){const x=(i*7+seed*3)%16,y=(i*11+seed)%16;fill(x,y,1+(i%11===0?1:0),1,i%4===0?'#c0b9a8':i%4===1?'#77776f':i%4===2?'#aaa69b':'#88877f');}}
 else if(style==='sandstone'){fill(0,0,16,16,'#d7c18a');for(const y of [3,8,13])fill(0,y,16,1,'#b99f68');for(let i=0;i<30;i++)fill((i*7+seed)%16,(i*5+2)%16,2,1,i%2?'#e7d5a8':'#c8af77');}
 else if(style==='snow'){fill(0,0,16,16,'#e8eef0');for(let i=0;i<38;i++){const x=(i*7+seed)%16,y=(i*11+seed*2)%16;fill(x,y,1+(i%9===0?1:0),1,i%3===0?'#cbdce5':i%3===1?'#ffffff':'#dbe7ec');}}
 else if(style==='clay'){fill(0,0,16,16,'#9b8f91');for(let i=0;i<45;i++)fill((i*7+seed)%16,(i*11+seed*3)%16,1,1,i%2?'#b0a3a4':'#827a7e');}
 else if(style==='obsidian'){fill(0,0,16,16,'#282236');for(let i=0;i<35;i++){const x=(i*7+seed)%16,y=(i*11+seed*2)%16;fill(x,y,1,1,i%3===0?'#65517f':i%3===1?'#171623':'#3d3158');}}
 else if(style==='sponge'){fill(0,0,16,16,'#d3c35a');for(let i=0;i<35;i++){const x=(i*7+seed)%15,y=(i*11+seed*2)%15;fill(x,y,2,2,i%2?'#ac9b3e':'#eadb83');fill(x,y,1,1,'#8b7d34');}}
 else if(style==='bookshelf'){fill(0,0,16,16,'#80512d');for(const y of [0,6,12]){fill(0,y,16,2,'#b58245');for(let x=1;x<16;x+=3){fill(x,y+2,2,3,['#8d3932','#31558a','#c4a23d','#477447'][(x+seed)%4]);fill(x,y+2,1,1,'#e0c58a');}}}
 else if(style==='metal'||style==='metalGold'||style==='diamond'){const base=style==='metal'?'#b7bdc0':style==='metalGold'?'#dfb72e':'#45c4bd';fill(0,0,16,16,base);for(let i=0;i<20;i++){const x=(i*7+seed)%16,y=(i*11+seed*2)%16;fill(x,y,1,1,i%2?'#ffffff':'#6f7779');}fill(1,1,14,1,style==='metal'?'#eff3f3':style==='metalGold'?'#fff0a3':'#a4f2e9');}
 else if(style==='ice'){fill(0,0,16,16,'#9dd8ed');for(let i=0;i<24;i++){const x=(i*7+seed)%16,y=(i*11+seed*2)%16;fill(x,y,1,3,i%2?'#e5fbff':'#68b5d4');}}
 else if(style==='woodSide'){fill(0,0,16,16,'#87572f');for(let x=1;x<16;x+=4){fill(x,0,1,16,'#684426');fill(x+1,0,1,16,'#a87642');}for(let y=3;y<16;y+=6)fill(0,y,16,1,'#76502f');}
 else if(style==='woodTop'){fill(0,0,16,16,'#b68b55');for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(Math.round(Math.abs(x-7.5)+Math.abs(y-7.5))%4===0)fill(x,y,1,1,'#8a6039');fill(7,7,2,2,'#d1aa72');}
 else if(style==='planks'){fill(0,0,16,16,'#bd9257');for(const y of [0,5,10,15])fill(0,y,16,1,'#815b36');for(const y of [1,6,11]){fill(4,y,1,4,'#9c713e');fill(12,y,1,4,'#a97b45');}for(let i=0;i<12;i++)fill((i*7+seed)%16,(i*3+2)%16,2,1,'#d0a66b');}
 else if(style==='leaves'){fill(0,0,16,16,'#397b37');for(let i=0;i<80;i++)fill((i*13+seed)%16,(i*7+seed*3)%16,1,1,i%4===0?'#245f2b':i%3===0?'#68a64a':'#4c9140');for(let i=0;i<20;i++)fill((i*5+seed)%16,(i*11+2)%16,1,1,'#a0c66b');}
 else if(style==='sand'){fill(0,0,16,16,'#d8c58d');for(let i=0;i<64;i++)fill((i*11+seed)%16,(i*7+seed*2)%16,1,1,i%3===0?'#c5af76':i%3===1?'#e7d7a5':'#bfa976');}
 else if(style==='water'){fill(0,0,16,16,'#398fc5');for(let y=1;y<16;y+=4)for(let x=y%2?0:3;x<16;x+=7)fill(x,y,3,1,'#63b4d9');for(let i=0;i<9;i++)fill((i*9+seed)%16,(i*5+3)%16,2,1,'#2878b0');}
 else if(style==='brick'){fill(0,0,16,16,'#a34f3c');for(const y of [0,5,10,15])fill(0,y,16,1,'#d2b49a');for(const y of [2,7,12]){fill(7,y,1,3,'#d2b49a');fill(15,y,1,3,'#d2b49a');}for(let i=0;i<12;i++)fill((i*7+seed)%16,(i*11)%16,2,1,'#b96149');}
 else if(style==='glass'){fill(0,0,16,16,'#b6dbe8');for(let i=0;i<16;i++)fill(i,i,1,1,'#effaff');for(let i=0;i<14;i++)fill(2+i,1,1,1,'#8cc5d9');}
 else if(style==='wool'){for(let y=0;y<16;y++)for(let x=0;x<16;x++)if((x*3+y*7+seed)%4===0)fill(x,y,1,1,'#ffffff22');}
 else {for(let i=0;i<54;i++){const x=(i*7+seed)%16,y=(i*11+seed*3)%16;fill(x,y,1,1,i%3===0?'#ffffff22':i%3===1?'#00000018':'#ffffff10');}}
 const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestMipmapNearestFilter;t.colorSpace=THREE.SRGBColorSpace;textures[name]=t;return t;
}
function material(name,color,seed,style){const o={map:texture(name,color,seed,style)};if(name==='leaves')o.alphaTest=.12;if(name==='water'){o.transparent=true;o.opacity=.78;o.depthWrite=false;}return new THREE.MeshLambertMaterial(o);}
function setupMats(){Object.assign(mats,{grassTop:material('grassTop',0x68aa45,2,'grassTop'),grassSide:material('grassSide',0x805638,3,'grassSide'),dirt:material('dirt',0x805638,4,'dirt'),stone:material('stone',0x858b91,5,'stone'),woodSide:material('woodSide',0x80522d,6,'woodSide'),woodTop:material('woodTop',0xb18a59,7,'woodTop'),leaves:material('leaves',0x397d3d,8,'leaves'),planks:material('planks',0xb88750,9,'planks'),sand:material('sand',0xd2bf83,10,'sand'),coalOre:material('coalOre',0x858b91,11,'coal'),ironOre:material('ironOre',0x858b91,12,'iron'),water:material('water',0x408fc2,13,'water'),bedrock:material('bedrock',0x34383b,14,'stone'),cobblestone:material('cobblestone',0x777d80,15,'cobble'),gravel:material('gravel',0x9a9185,16,'gravel'),sandstone:material('sandstone',0xd2b77a,17,'sandstone'),brick:material('brick',0xa34f3c,18,'brick'),stoneBrick:material('stoneBrick',0x8c9293,19,'stoneBrick'),mossStone:material('mossStone',0x718467,20,'mossStone'),glass:material('glass',0xb6dbe8,21,'glass'),ice:material('ice',0x9dd8ed,22,'ice'),snow:material('snow',0xe6edf1,23,'snow'),clay:material('clay',0x9b8f91,24,'clay'),obsidian:material('obsidian',0x30243f,25,'obsidian'),sponge:material('sponge',0xd8c65b,26,'sponge'),bookshelf:material('bookshelf',0x8a613b,27,'bookshelf'),ironBlock:material('ironBlock',0xc9ccca,28,'metal'),goldBlock:material('goldBlock',0xe5c34a,29,'metalGold'),diamondBlock:material('diamondBlock',0x54c9bf,30,'diamond'),redWool:material('redWool',0xb63d36,31,'wool'),orangeWool:material('orangeWool',0xe18a35,32,'wool'),yellowWool:material('yellowWool',0xe6d04f,33,'wool'),limeWool:material('limeWool',0x9ecb43,34,'wool'),greenWool:material('greenWool',0x4c9b46,35,'wool'),cyanWool:material('cyanWool',0x55b8b0,36,'wool'),blueWool:material('blueWool',0x466bb3,37,'wool'),purpleWool:material('purpleWool',0x7c54a2,38,'wool'),whiteWool:material('whiteWool',0xe6e6df,39,'wool')});
 mats.glass.transparent=true;mats.glass.opacity=.42;mats.glass.depthWrite=false;mats.ice.transparent=true;mats.ice.opacity=.68;mats.ice.depthWrite=false;}
function faceMat(type,n){if(type==='grass')return n[1]===1?'grassTop':n[1]===-1?'dirt':'grassSide';if(type==='wood')return n[1]===0?'woodSide':'woodTop';return type;}
const faces=[{n:[1,0,0],v:[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]]},{n:[-1,0,0],v:[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]]},{n:[0,1,0],v:[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]]},{n:[0,-1,0],v:[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]},{n:[0,0,1],v:[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]},{n:[0,0,-1],v:[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]}];
function buildWorld(){
 world.clear();for(let x=-64;x<64;x++)for(let z=-64;z<64;z++){const h=heightAt(x,z),beach=h<=4;for(let y=MIN_Y;y<=h;y++){let t=y===MIN_Y?'bedrock':y===h?(beach?'sand':'grass'):y>=h-3?(beach?'sand':'dirt'):'stone';if(y>MIN_Y+1&&y<h-2){const v=random(x*3+y,z*5-y,17)%265;if(v===0)t='coalOre';else if(v===1)t='ironOre';}setRaw(x,y,z,t);}if(h<5)for(let y=h+1;y<=5;y++)setRaw(x,y,z,'water');if(random(x,z,42)%173===0&&h>5&&Math.abs(x)>3&&Math.abs(z)>3){for(let y=h+1;y<=h+4;y++)setRaw(x,y,z,'wood');for(let dy=2;dy<=5;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){if(Math.abs(dx)+Math.abs(dz)>3+(dy===5?-2:0))continue;if(get(x+dx,h+dy,z+dz)==='air')setRaw(x+dx,h+dy,z+dz,'leaves');}}}
 try{const save=JSON.parse(localStorage.getItem(STORE)||'null');if(Array.isArray(save?.changes))for(const [k,t] of save.changes){const p=k.split(',').map(Number);if(p.length===3&&p.every(Number.isFinite)){changes.set(k,t);setRaw(...p,t);}}if(save?.inventory)Object.assign(inventory,save.inventory);if(save?.player&&[save.player.x,save.player.y,save.player.z].every(Number.isFinite))Object.assign(player,save.player);else player.y=heightAt(0,0)+1.42;if(save?.packColors)Object.assign(packColors,save.packColors);}catch(e){player.x=0;player.z=0;player.y=heightAt(0,0)+1.42;}
}
function buildChunk(cx,cz){
 const id=cx+','+cz,old=chunks.get(id);if(old){scene.remove(old);old.geometry.dispose();chunks.delete(id);}
 const names=Object.keys(mats),lists={};for(const n of names)lists[n]={p:[],norm:[],uv:[],idx:[]};
 for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x++)for(let z=cz*CHUNK;z<(cz+1)*CHUNK;z++)for(let y=MIN_Y;y<=MAX_Y;y++){const t=get(x,y,z);if(t==='air')continue;for(const f of faces){const near=get(x+f.n[0],y+f.n[1],z+f.n[2]);if(near!=='air'&&(t!=='water'||near==='water'))continue;const l=lists[faceMat(t,f.n)];if(!l)continue;const base=l.p.length/3;for(let i=0;i<4;i++){const v=f.v[i];l.p.push(x+v[0],y+v[1],z+v[2]);l.norm.push(f.n[0],f.n[1],f.n[2]);l.uv.push(i===1||i===2?1:0,i>=2?1:0);}l.idx.push(base,base+1,base+2,base,base+2,base+3);}}
 const g=new THREE.BufferGeometry(),p=[],n=[],uv=[],idx=[];let vo=0,io=0;
 names.forEach((name,i)=>{const l=lists[name];if(!l.idx.length)return;for(const v of l.p)p.push(v);for(const v of l.norm)n.push(v);for(const v of l.uv)uv.push(v);for(const v of l.idx)idx.push(v+vo);g.addGroup(io,l.idx.length,i);vo+=l.p.length/3;io+=l.idx.length;});
 if(!idx.length)return;g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeBoundingSphere();
 const mesh=new THREE.Mesh(g,names.map(k=>mats[k]));scene.add(mesh);chunks.set(id,mesh);
}
function rebuild(x,z){const cx=chunk(x),cz=chunk(z),lx=((x%CHUNK)+CHUNK)%CHUNK,lz=((z%CHUNK)+CHUNK)%CHUNK;buildChunk(cx,cz);if(lx===0)buildChunk(cx-1,cz);if(lx===15)buildChunk(cx+1,cz);if(lz===0)buildChunk(cx,cz-1);if(lz===15)buildChunk(cx,cz+1);worldObjects=[...chunks.values()];}
function setBlock(x,y,z,t){const k=key(x,y,z);t==='air'?world.delete(k):world.set(k,t);changes.set(k,t);rebuild(x,z);saveWorld();}
function saveWorld(){try{localStorage.setItem(STORE,JSON.stringify({changes:[...changes],inventory,player:{x:player.x,y:player.y,z:player.z},packColors}));const s=$('packStatus');if(s)s.textContent='World saved in this browser.';}catch(e){const s=$('packStatus');if(s)s.textContent='Browser storage is full; could not save.';}}
function applyPackColors(){for(const [name,color] of Object.entries(packColors)){const k=name==='grass'?'grassTop':name==='wood'?'woodSide':name;if(mats[k]&&/^#[0-9a-f]{6}$/i.test(color))mats[k].color.set(color);if(name==='grass')mats.grassSide.color.set(color);}}
function collision(px,py,pz){for(let x=Math.floor(px-.8);x<=Math.ceil(px+.8);x++)for(let y=Math.floor(py-1);y<=Math.ceil(py+.9);y++)for(let z=Math.floor(pz-.8);z<=Math.ceil(pz+.8);z++){const t=get(x,y,z);if(t==='air'||t==='water'||!info[t]?.[0])continue;if(Math.abs(px-x)<.8&&Math.abs(pz-z)<.8&&py-.9<y+.5&&py+.9>y-.5)return true;}return false;}
function makeClouds(){const geo=new THREE.BoxGeometry(3,1,2),mat=new THREE.MeshLambertMaterial({color:0xf3f5ef});for(let i=0;i<22;i++){const group=new THREE.Group(),x=random(i,7,2)%150-75,z=random(i,9,3)%150-75,y=20+random(i,4,8)%7;for(let j=0;j<3+random(i,6,9)%4;j++){const b=new THREE.Mesh(geo,mat);b.position.set(j%3*2.2,(j*7)%3*.45,j%2*1.4);group.add(b);}group.position.set(x,y,z);scene.add(group);clouds.push(group);}}
function makeSlimes(){const bodyMat=new THREE.MeshLambertMaterial({color:0x73ad4e}),eyeMat=new THREE.MeshLambertMaterial({color:0xf7f3da}),pupilMat=new THREE.MeshLambertMaterial({color:0x20291b}),bodyGeo=new THREE.BoxGeometry(.8,.65,.8);for(let i=0;i<5;i++){const x=-24+i*12,z=i%2?17:-18,h=heightAt(x,z),g=new THREE.Group(),body=new THREE.Mesh(bodyGeo,bodyMat);body.position.y=.4;g.add(body);for(const side of [-1,1]){const eye=new THREE.Mesh(new THREE.BoxGeometry(.13,.15,.06),eyeMat);eye.position.set(side*.19,.52,.408);g.add(eye);const pupil=new THREE.Mesh(new THREE.BoxGeometry(.055,.08,.035),pupilMat);pupil.position.set(side*.19,.51,.45);g.add(pupil);}g.position.set(x,h+.5,z);g.userData={angle:random(x,z,3)/4294967295*Math.PI*2,speed:.4+i%3*.1,baseY:h+.5,phase:i,health:3};scene.add(g);slimes.push(g);}}
function init(){
 try{
  scene=new THREE.Scene();const day=new THREE.Color(0x87c5ed);scene.background=day.clone();scene.fog=new THREE.Fog(day,55,145);
  camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.1,180);camera.rotation.order='YXZ';
  renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.35));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;$('game').appendChild(renderer.domElement);
  hemi=new THREE.HemisphereLight(0xe5f3ff,0x657348,1.6);scene.add(hemi);sun=new THREE.DirectionalLight(0xfff2d7,1.7);sun.position.set(-30,55,22);scene.add(sun);
  sunOrb=new THREE.Mesh(new THREE.SphereGeometry(3,12,8),new THREE.MeshBasicMaterial({color:0xffe7a3}));moonOrb=new THREE.Mesh(new THREE.SphereGeometry(2.1,10,8),new THREE.MeshBasicMaterial({color:0xdde7f5}));scene.add(sunOrb,moonOrb);
  selectionBox=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.008,1.008,1.008)),new THREE.LineBasicMaterial({color:0xffffff}));selectionBox.visible=false;scene.add(selectionBox);
  setupMats();buildWorld();applyPackColors();for(let x=-4;x<=3;x++)for(let z=-4;z<=3;z++)buildChunk(x,z);worldObjects=[...chunks.values()];makeClouds();camera.position.set(player.x,player.y+.55,player.z);return true;
 }catch(e){console.error(e);$('errorText').textContent='3D graphics could not start. Enable browser hardware acceleration and reload.';$('errorScreen').classList.remove('hidden');return false;}
}
function drawBlockIcon(canvas,item){
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,32,34);ctx.imageSmoothingEnabled=false;
 const faces=[
  {key:faceMat(item,[0,1,0]),pts:[[16,2],[30,9],[16,17],[2,9]],box:[2,2,28,15]},
  {key:faceMat(item,[0,0,1]),pts:[[2,9],[16,17],[16,32],[2,24]],box:[2,9,14,23]},
  {key:faceMat(item,[1,0,0]),pts:[[16,17],[30,9],[30,24],[16,32]],box:[16,9,14,23]}
 ];
 for(const face of faces){
  ctx.save();ctx.beginPath();face.pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
  const tex=textures[face.key]?.image;
  if(tex)ctx.drawImage(tex,face.box[0],face.box[1],face.box[2],face.box[3]);
  else {ctx.fillStyle='#858585';ctx.fillRect(face.box[0],face.box[1],face.box[2],face.box[3]);}
  if(item==='water') {ctx.fillStyle='#4da9df55';ctx.fillRect(face.box[0],face.box[1],face.box[2],face.box[3]);}
  ctx.restore();
  ctx.beginPath();face.pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.strokeStyle='#24241f';ctx.lineWidth=1;ctx.stroke();
 }
 if(packColors[item]){
  ctx.save();ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.22;ctx.fillStyle=packColors[item];ctx.fillRect(0,0,32,34);ctx.restore();
 }
}
function drawBar(){
 const root=$('hotbar');root.innerHTML='';
 barItems.forEach((item,i)=>{
  const el=document.createElement('button');el.type='button';el.className='slot'+(selected===i?' selected':'');
  el.setAttribute('aria-label','Slot '+(i+1)+': '+(info[item]?.[0]||item));
  const canvas=document.createElement('canvas');canvas.className='block-icon';canvas.width=36;canvas.height=36;canvas.setAttribute('aria-hidden','true');
  el.title=info[item]?.[0]||item;
  el.append(canvas);el.onclick=()=>{selected=i;drawBar();};root.appendChild(el);drawBlockIcon(canvas,item);
 });
}
function renderInventory(){
 const root=$('inventoryGrid');root.innerHTML='';
 for(const item of creativeBlocks){
  const b=document.createElement('button');b.className='inventory-item'+(barItems[selected]===item?' active':'');b.type='button';
  const canvas=document.createElement('canvas');canvas.className='block-preview';canvas.width=36;canvas.height=36;
  b.append(canvas);drawBlockIcon(canvas,item);
  b.title=info[item][0];
  b.setAttribute('aria-label',info[item][0]);
  b.onclick=()=>{barItems[selected]=item;drawBar();renderInventory();$('craftStatus').textContent=info[item][0]+' selected for hotbar slot '+(selected+1)+'.';};
  root.appendChild(b);
 }
 $('craftStatus').textContent='Select a block for the highlighted hotbar slot. All blocks are unlimited.';
}
function showInventory(){panel=true;document.exitPointerLock?.();$('inventoryScreen').classList.remove('hidden');renderInventory();}
function hideInventory(){panel=false;$('inventoryScreen').classList.add('hidden');if(running)renderer.domElement.requestPointerLock();}
function pause(){if(running&&!panel)$('pauseScreen').classList.remove('hidden');}
function resume(){ $('pauseScreen').classList.add('hidden');if(running)renderer.domElement.requestPointerLock();}
function target(distance=6){ray.setFromCamera(new THREE.Vector2(0,0),camera);ray.far=distance;const hits=ray.intersectObjects(worldObjects,false);return hits[0]||null;}
function hitBlock(hit,inside=true){const n=hit.face.normal,o=inside?-.02:.02;return[Math.round(hit.point.x+n.x*o),Math.round(hit.point.y+n.y*o),Math.round(hit.point.z+n.z*o)];}
function breakBlock(x,y,z,type){if(type==='air'||type==='bedrock')return;setBlock(x,y,z,'air');}
function placeBlock(){
 const item=barItems[selected];if(!info[item])return;
 const h=target(5.5);if(!h)return;const [x,y,z]=hitBlock(h,false);
 if(get(x,y,z)!=='air'||y>MAX_Y||y<=MIN_Y)return;
 if(Math.abs(player.x-x)<.8&&Math.abs(player.z-z)<.8&&player.y-.9<y+.5&&player.y+.9>y-.5)return;
 setBlock(x,y,z,item);
}
function move(dt){
 const f=(pressed.KeyW||pressed.ArrowUp?1:0)-(pressed.KeyS||pressed.ArrowDown?1:0),s=(pressed.KeyD||pressed.ArrowRight?1:0)-(pressed.KeyA||pressed.ArrowLeft?1:0),mag=Math.hypot(f,s)||1,speed=pressed.ShiftLeft||pressed.ShiftRight?8.5:5.1;
 const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)/mag*speed*dt,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)/mag*speed*dt,ox=player.x,oz=player.z;player.x+=dx;if(collision(player.x,player.y,player.z))player.x=ox;player.z+=dz;if(collision(player.x,player.y,player.z))player.z=oz;
 if(pressed.Space&&player.grounded){player.vy=7.2;player.grounded=false;pressed.Space=false;}const oy=player.y;player.vy-=19*dt;player.y+=player.vy*dt;if(collision(player.x,player.y,player.z)){player.y=oy;if(player.vy<0)player.grounded=true;player.vy=0;}else player.grounded=false;
 player.x=Math.max(-63,Math.min(63,player.x));player.z=Math.max(-63,Math.min(63,player.z));if(player.y<MIN_Y-5){player.x=0;player.z=0;player.y=heightAt(0,0)+1.42;player.vy=0;}camera.position.set(player.x,player.y+.55,player.z);camera.rotation.set(pitch,yaw,0);
}
function dayNight(dt){clock+=dt;sun.intensity=1.75;hemi.intensity=1.55;sun.position.set(-32,58,24);sunOrb.position.set(-32,58,24);moonOrb.visible=false;if(scene.fog)scene.fog.color.set(0x87c5ed);for(const c of clouds)c.position.x+=Math.sin(clock*.018+c.position.z)*dt*.08;}
function updateOutline(){const h=target(6);if(!h){selectionBox.visible=false;return;}const [x,y,z]=hitBlock(h,true);if(get(x,y,z)==='air'){selectionBox.visible=false;return;}selectionBox.visible=true;selectionBox.position.set(x,y,z);}
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000||0,.04);last=now;if(locked&&running&&!panel){move(dt);updateOutline();}else{selectionBox.visible=false;}dayNight(dt);renderer.render(scene,camera);fpsFrames++;if(now-fpsAt>1000){$('fps').textContent=fpsFrames+' FPS';fpsFrames=0;fpsAt=now;$('coords').textContent=Math.floor(player.x)+', '+Math.floor(player.y)+', '+Math.floor(player.z);}if(now-saveAt>12000&&running){saveWorld();saveAt=now;}}
function applyPack(file){const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(String(reader.result));if(!data?.colors||typeof data.colors!=='object')throw Error('format');let n=0;for(const [name,color] of Object.entries(data.colors)){if(!Object.prototype.hasOwnProperty.call(info,name)||typeof color!=='string'||!/^#[0-9a-f]{6}$/i.test(color))continue;packColors[name]=color;const k=name==='grass'?'grassTop':name==='wood'?'woodSide':name;if(mats[k])mats[k].color.set(color);if(name==='grass')mats.grassSide.color.set(color);n++;}drawBar();if(panel)renderInventory();saveWorld();$('packStatus').textContent='Applied '+n+' block colours.';}catch(e){$('packStatus').textContent='Invalid Minecraft colour pack.';}};reader.readAsText(file);}
if(init()){drawBar();requestAnimationFrame(frame);}
document.addEventListener('keydown',e=>{pressed[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;if(/^Digit[1-9]$/.test(e.code)){selected=+e.code.slice(5)-1;drawBar();}if((e.code==='KeyB'||e.code==='KeyE')&&running&&!panel)showInventory();else if(e.code==='KeyF'&&running&&!panel){fogEnabled=!fogEnabled;scene.fog=fogEnabled?new THREE.Fog(0x87c5ed,55,145):null;}else if(e.code==='Escape'&&panel)hideInventory();else if(e.code==='Escape'&&running&&!locked&&!panel)resume();});
document.addEventListener('keyup',e=>pressed[e.code]=false);
document.addEventListener('mousemove',e=>{if(!locked||panel)return;yaw-=e.movementX*.0022;pitch=Math.max(-1.52,Math.min(1.52,pitch-e.movementY*.0022));});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===renderer?.domElement;if(running&&!panel&&!locked)pause();});
document.addEventListener('mousedown',e=>{if(!locked||panel||!running)return;if(e.button===0){const h=target(6);if(h){const [x,y,z]=hitBlock(h,true);breakBlock(x,y,z,get(x,y,z));}}else if(e.button===2)placeBlock();else if(e.button===1){e.preventDefault();const h=target(6);if(h){const [x,y,z]=hitBlock(h,true),type=get(x,y,z);if(info[type]){const i=barItems.indexOf(type);if(i>=0)selected=i;else barItems[selected]=type;drawBar();}}}});

document.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('wheel',e=>{if(!locked||panel||!running)return;e.preventDefault();selected=(selected+(e.deltaY>0?1:8))%9;drawBar();},{passive:false});
$('playBtn').onclick=()=>{running=true;$('startScreen').classList.add('hidden');renderer.domElement.requestPointerLock();};
$('resumeBtn').onclick=resume;$('pauseSaveBtn').onclick=()=>{saveWorld();resume();};$('closeInventory').onclick=hideInventory;
$('packFile').onchange=e=>{if(e.target.files[0])applyPack(e.target.files[0]);e.target.value='';};$('saveBtn').onclick=saveWorld;$('fullscreenBtn').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.();};
window.addEventListener('resize',()=>{if(camera&&renderer){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}});
window.addEventListener('beforeunload',saveWorld);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveWorld();});

import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const WORLD_SIZE = 80;
const CHUNK = 16;
const MIN_Y = -4;
const MAX_Y = 24;
const STORE_KEY = 'blockworld-save-v2';

const blockInfo = {
  grass: {name:'Grass', icon:'🟩', solid:true, drop:'grass'},
  dirt: {name:'Dirt', icon:'🟫', solid:true, drop:'dirt'},
  stone: {name:'Stone', icon:'⬜', solid:true, drop:'stone'},
  wood: {name:'Log', icon:'🪵', solid:true, drop:'wood'},
  leaves: {name:'Leaves', icon:'🌿', solid:true, drop:'leaves'},
  planks: {name:'Planks', icon:'🟨', solid:true, drop:'planks'},
  sand: {name:'Sand', icon:'🟨', solid:true, drop:'sand'},
  coalOre: {name:'Coal ore', icon:'⚫', solid:true, drop:'coalOre'},
  ironOre: {name:'Iron ore', icon:'🔘', solid:true, drop:'ironOre'},
  water: {name:'Water', icon:'🟦', solid:false, drop:null},
  bedrock: {name:'Bedrock', icon:'⬛', solid:true, drop:null}
};
const hotbarItems = ['grass','dirt','stone','wood','planks','leaves','sand','spear'];
const packColors = {};

let scene, camera, renderer, sun, hemi;
let world = new Map();
let changes = new Map();
let chunkMeshes = new Map();
let raycaster = new THREE.Raycaster();
let worldObjects = [];
let materials = {};
let textures = {};
let running = false;
let locked = false;
let panelOpen = false;
let selected = 0;
let yaw = 0;
let pitch = 0;
let lastTime = 0;
let frameCount = 0;
let fpsAt = 0;
let clockTime = 0;
let saveAt = 0;
const pressed = Object.create(null);
const player = {x:0,y:10,z:0,vy:0,grounded:false};
const inventory = {grass:32,dirt:32,stone:32,wood:16,planks:24,leaves:16,sand:16,coalOre:0,ironOre:0};
const slimes = [];

const keyOf = (x,y,z) => x + ',' + y + ',' + z;
const chunkOf = (n) => Math.floor(n / CHUNK);
function seeded(x,z,s=0) {
  let n = Math.imul(x + 173, 374761393) + Math.imul(z + 591, 668265263) + Math.imul(s + 911, 2246822519);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}
function terrainHeight(x,z) {
  const hills = Math.sin(x * .105) * 2.1 + Math.cos(z * .12) * 1.8 + Math.sin((x+z) * .075) * 1.5 + Math.cos((x-z) * .045);
  return Math.max(3, Math.min(12, Math.floor(6 + hills)));
}
function getBlock(x,y,z) {
  return world.get(keyOf(x,y,z)) || 'air';
}
function setRaw(x,y,z,type) {
  const k = keyOf(x,y,z);
  if (type === 'air') world.delete(k);
  else world.set(k,type);
}
function createTexture(name, base, seed, style='noise') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const r = (base >> 16) & 255, g = (base >> 8) & 255, b = base & 255;
  for (let y=0;y<16;y++) for (let x=0;x<16;x++) {
    let v = ((x*17 + y*31 + seed*13) % 19) - 9;
    let rr=Math.max(0,Math.min(255,r+v)), gg=Math.max(0,Math.min(255,g+v)), bb=Math.max(0,Math.min(255,b+v));
    if (style==='grassSide' && y<3) { rr=104+v; gg=159+v; bb=64+v; }
    if (style==='ore' && ((x*7+y*11+seed)%17<3)) { rr=style==='ore' ? 185 : rr; gg=style==='ore' ? 173 : gg; bb=style==='ore' ? 145 : bb; }
    if (style==='leaves' && (x+y+seed)%5===0) { rr+=12; gg+=18; }
    ctx.fillStyle='rgb('+rr+','+gg+','+bb+')';
    ctx.fillRect(x,y,1,1);
  }
  if (style==='coal') {
    for(let i=0;i<13;i++){const x=(i*7+seed)%16,y=(i*11+3)%16;ctx.fillStyle='#202629';ctx.fillRect(x,y,2,2);}
  }
  if (style==='iron') {
    for(let i=0;i<10;i++){const x=(i*5+seed)%16,y=(i*9+4)%16;ctx.fillStyle='#c8a985';ctx.fillRect(x,y,2,2);}
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipmapNearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  textures[name] = tex;
  return tex;
}
function makeMaterial(name, base, seed, style) {
  return new THREE.MeshLambertMaterial({map:createTexture(name,base,seed,style), color:0xffffff});
}
function setupMaterials() {
  materials = {
    grassTop:makeMaterial('grassTop',0x72ae4d,2),
    grassSide:makeMaterial('grassSide',0x805638,3,'grassSide'),
    dirt:makeMaterial('dirt',0x805638,4),
    stone:makeMaterial('stone',0x858b91,5),
    woodSide:makeMaterial('woodSide',0x80522d,6),
    woodTop:makeMaterial('woodTop',0xb18a59,7),
    leaves:makeMaterial('leaves',0x397d3d,8,'leaves'),
    planks:makeMaterial('planks',0xb88750,9),
    sand:makeMaterial('sand',0xd2bf83,10),
    coalOre:makeMaterial('coalOre',0x858b91,11,'coal'),
    ironOre:makeMaterial('ironOre',0x858b91,12,'iron'),
    water:new THREE.MeshLambertMaterial({map:createTexture('water',0x408fc2,13),transparent:true,opacity:.72,depthWrite:false}),
    bedrock:makeMaterial('bedrock',0x34383b,14)
  };
}
function faceMaterial(type, normal) {
  if (type==='grass') return normal[1]===1 ? 'grassTop' : normal[1]===-1 ? 'dirt' : 'grassSide';
  if (type==='wood') return normal[1]===0 ? 'woodSide' : 'woodTop';
  return type;
}

const faces = [
  {n:[1,0,0],v:[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]]},
  {n:[-1,0,0],v:[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]]},
  {n:[0,1,0],v:[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]]},
  {n:[0,-1,0],v:[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]},
  {n:[0,0,1],v:[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]},
  {n:[0,0,-1],v:[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]}
];

function buildWorldData() {
  world.clear();
  const half = WORLD_SIZE/2;
  for(let x=-half;x<half;x++) {
    for(let z=-half;z<half;z++) {
      const h=terrainHeight(x,z);
      const beach=h<=4;
      for(let y=MIN_Y;y<=h;y++) {
        let type;
        if(y===MIN_Y) type='bedrock';
        else if(y===h) type=beach?'sand':'grass';
        else if(y>=h-3) type=beach?'sand':'dirt';
        else type='stone';
        if(y>MIN_Y+1 && y<h-2) {
          const v=seeded(x*3+y,z*5-y,17)%310;
          if(v===0) type='coalOre';
          if(v===1) type='ironOre';
        }
        setRaw(x,y,z,type);
      }
      if(h<5) for(let y=h+1;y<=5;y++) setRaw(x,y,z,'water');

      const tree=seeded(x,z,42)%173===0 && h>5 && Math.abs(x)>3 && Math.abs(z)>3;
      if(tree) {
        for(let y=h+1;y<=h+4;y++) setRaw(x,y,z,'wood');
        for(let dy=2;dy<=5;dy++) {
          const radius=dy===5?1:dy===2?2:2;
          for(let dx=-radius;dx<=radius;dx++) for(let dz=-radius;dz<=radius;dz++) {
            if(Math.abs(dx)+Math.abs(dz)>radius*2-1 && dy!==5) continue;
            const lx=x+dx,lz=z+dz,ly=h+dy;
            if(getBlock(lx,ly,lz)==='air') setRaw(lx,ly,lz,'leaves');
          }
        }
      }
    }
  }
  try {
    const saved=JSON.parse(localStorage.getItem(STORE_KEY)||'null');
    if(saved && Array.isArray(saved.changes)) {
      for(const entry of saved.changes) {
        if(Array.isArray(entry) && entry.length===2) {
          const [k,type]=entry;
          changes.set(k,type);
          const parts=k.split(',').map(Number);
          if(parts.length===3 && parts.every(Number.isFinite)) setRaw(parts[0],parts[1],parts[2],type);
        }
      }
    }
    if(saved && saved.inventory) Object.assign(inventory,saved.inventory);
    if(saved && saved.player && Number.isFinite(saved.player.x) && Number.isFinite(saved.player.y) && Number.isFinite(saved.player.z)) {
      player.x=saved.player.x; player.y=saved.player.y; player.z=saved.player.z;
    } else {
      player.x=0; player.z=0; player.y=terrainHeight(0,0)+1.42;
    }
    if(saved && saved.packColors) Object.assign(packColors,saved.packColors);
  } catch(e) {
    player.x=0; player.z=0; player.y=terrainHeight(0,0)+1.42;
  }
}

function buildChunk(cx,cz) {
  const id=cx+','+cz;
  const old=chunkMeshes.get(id);
  if(old) {
    scene.remove(old);
    old.geometry.dispose();
    chunkMeshes.delete(id);
  }
  const lists={};
  const materialNames=Object.keys(materials);
  for(const name of materialNames) lists[name]={p:[],n:[],uv:[],idx:[]};
  const x0=cx*CHUNK,z0=cz*CHUNK;
  for(let x=x0;x<x0+CHUNK;x++) for(let z=z0;z<z0+CHUNK;z++) {
    for(let y=MIN_Y;y<=MAX_Y;y++) {
      const type=getBlock(x,y,z);
      if(type==='air') continue;
      for(const face of faces) {
        const nx=x+face.n[0],ny=y+face.n[1],nz=z+face.n[2];
        const adjacent=getBlock(nx,ny,nz);
        if(adjacent!=='air' && (type!=='water' || adjacent==='water')) continue;
        const matName=faceMaterial(type,face.n);
        const list=lists[matName];
        if(!list) continue;
        const base=list.p.length/3;
        for(let i=0;i<4;i++) {
          const v=face.v[i];
          list.p.push(x+v[0],y+v[1],z+v[2]);
          list.n.push(face.n[0],face.n[1],face.n[2]);
          list.uv.push(i===1||i===2?1:0,i>=2?1:0);
        }
        list.idx.push(base,base+1,base+2,base,base+2,base+3);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  const allP=[],allN=[],allUV=[],allI=[];
  let vertexOffset=0,indexOffset=0;
  geometry.clearGroups();
  for(let i=0;i<materialNames.length;i++) {
    const list=lists[materialNames[i]];
    if(!list.idx.length) continue;
    allP.push(...list.p); allN.push(...list.n); allUV.push(...list.uv);
    const idx=list.idx.map(v=>v+vertexOffset);
    allI.push(...idx);
    geometry.addGroup(indexOffset,idx.length,i);
    vertexOffset+=list.p.length/3;
    indexOffset+=idx.length;
  }
  if(!allI.length) return;
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(allP,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(allN,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(allUV,2));
  geometry.setIndex(allI);
  geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,materialNames.map(n=>materials[n]));
  mesh.userData.chunk=id;
  scene.add(mesh);
  chunkMeshes.set(id,mesh);
}
function rebuildAt(x,z) {
  const cx=chunkOf(x),cz=chunkOf(z);
  buildChunk(cx,cz);
  const lx=((x%CHUNK)+CHUNK)%CHUNK,lz=((z%CHUNK)+CHUNK)%CHUNK;
  if(lx===0) buildChunk(cx-1,cz);
  if(lx===CHUNK-1) buildChunk(cx+1,cz);
  if(lz===0) buildChunk(cx,cz-1);
  if(lz===CHUNK-1) buildChunk(cx,cz+1);
  worldObjects=Array.from(chunkMeshes.values());
}
function setBlock(x,y,z,type) {
  const k=keyOf(x,y,z);
  if(type==='air') world.delete(k); else world.set(k,type);
  changes.set(k,type);
  rebuildAt(x,z);
  saveWorld();
}
function saveWorld() {
  try {
    localStorage.setItem(STORE_KEY,JSON.stringify({
      changes:Array.from(changes.entries()),
      inventory,
      player:{x:player.x,y:player.y,z:player.z},
      packColors
    }));
    $('packStatus').textContent='World saved in this browser.';
  } catch(e) {
    $('packStatus').textContent='Could not save: browser storage may be full.';
  }
}
function loadPackColors() {
  for(const [name,color] of Object.entries(packColors)) {
    const target=name==='grass'?'grassTop':name==='wood'?'woodSide':name;
    if(materials[target] && /^#[0-9a-f]{6}$/i.test(color)) materials[target].color.set(color);
    if(name==='grass' && materials.grassSide) materials.grassSide.color.set(color);
  }
}
function blockCollision(px,py,pz) {
  const minX=Math.floor(px-.8),maxX=Math.ceil(px+.8);
  const minY=Math.floor(py-.9-.5),maxY=Math.ceil(py+.9+.5);
  const minZ=Math.floor(pz-.8),maxZ=Math.ceil(pz+.8);
  for(let x=minX;x<=maxX;x++) for(let y=minY;y<=maxY;y++) for(let z=minZ;z<=maxZ;z++) {
    const type=getBlock(x,y,z);
    if(type==='air'||type==='water'||!blockInfo[type]?.solid) continue;
    if(Math.abs(px-x)<.8 && Math.abs(pz-z)<.8 && py-.9<y+.5 && py+.9>y-.5) return true;
  }
  return false;
}

function createSlimes() {
  const bodyMat=new THREE.MeshLambertMaterial({color:0x6eae59});
  const eyeMat=new THREE.MeshLambertMaterial({color:0xf4f1d9});
  const pupilMat=new THREE.MeshLambertMaterial({color:0x1c251b});
  const bodyGeo=new THREE.BoxGeometry(.8,.65,.8);
  const eyeGeo=new THREE.BoxGeometry(.13,.15,.06);
  const pupilGeo=new THREE.BoxGeometry(.055,.08,.035);
  for(let i=0;i<5;i++) {
    const x=-24+i*12,z=(i%2?17:-18),h=terrainHeight(x,z);
    const group=new THREE.Group();
    const body=new THREE.Mesh(bodyGeo,bodyMat); body.position.y=.4; group.add(body);
    for(const side of [-1,1]) {
      const eye=new THREE.Mesh(eyeGeo,eyeMat); eye.position.set(side*.19,.52,.408); group.add(eye);
      const pupil=new THREE.Mesh(pupilGeo,pupilMat); pupil.position.set(side*.19,.51,.45); group.add(pupil);
    }
    group.position.set(x,h+.5,z);
    group.userData={angle:seeded(x,z,3)/4294967295*Math.PI*2,speed:.45+(i%3)*.12,baseY:h+.5,phase:i};
    scene.add(group); slimes.push(group);
  }
}
function initThree() {
  try {
    scene=new THREE.Scene();
    const dayColor=new THREE.Color(0x8cc5e8);
    scene.background=dayColor.clone();
    scene.fog=new THREE.Fog(dayColor,35,105);
    camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.1,180);
    camera.rotation.order='YXZ';
    renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
    renderer.setSize(innerWidth,innerHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    $('game').appendChild(renderer.domElement);
    hemi=new THREE.HemisphereLight(0xdceeff,0x66734d,1.55); scene.add(hemi);
    sun=new THREE.DirectionalLight(0xfff0d2,1.6); sun.position.set(-30,55,22); scene.add(sun);
    setupMaterials();
    buildWorldData();
    loadPackColors();
    for(let cx=-3;cx<=2;cx++) for(let cz=-3;cz<=2;cz++) buildChunk(cx,cz);
    worldObjects=Array.from(chunkMeshes.values());
    createSlimes();
    camera.position.set(player.x,player.y+.55,player.z);
    return true;
  } catch(error) {
    console.error(error);
    $('errorText').textContent='Your browser or graphics driver could not create the 3D world. Try updating the browser or enabling hardware acceleration.';
    $('errorScreen').classList.remove('hidden');
    return false;
  }
}

function drawHotbar() {
  const root=$('hotbar'); root.innerHTML='';
  hotbarItems.forEach((item,i)=>{
    const node=document.createElement('div');
    node.className='slot'+(selected===i?' selected':'');
    const icon=item==='spear'?'🔱':blockInfo[item].icon;
    const amount=item==='spear'?'∞':(inventory[item]??0);
    node.innerHTML='<span class="num">'+(i+1)+'</span><strong>'+icon+'</strong><span class="amount">'+amount+'</span>';
    node.addEventListener('click',()=>{selected=i;drawHotbar()});
    root.appendChild(node);
  });
}
function renderInventory() {
  const root=$('inventoryGrid'); root.innerHTML='';
  const items=['grass','dirt','stone','wood','planks','leaves','sand','coalOre','ironOre','spear'];
  items.forEach(item=>{
    const info=blockInfo[item];
    const name=item==='spear'?'Spear (reach tool)':info.name;
    const count=item==='spear'?'Tool':(inventory[item]??0)+' in bag';
    const button=document.createElement('button');
    button.className='inventory-item';
    button.innerHTML='<strong>'+(item==='spear'?'🔱':info.icon)+'</strong><span>'+name+'</span><small>'+count+'</small>';
    button.addEventListener('click',()=>{
      if(item==='spear') selected=7;
      else {const idx=hotbarItems.indexOf(item); if(idx>=0) selected=idx; else $('packStatus').textContent=name+' is collected but not in the hotbar yet.';}
      drawHotbar();
    });
    root.appendChild(button);
  });
}
function showInventory() {
  panelOpen=true;
  document.exitPointerLock?.();
  $('inventoryScreen').classList.remove('hidden');
  renderInventory();
}
function hideInventory() {
  panelOpen=false;
  $('inventoryScreen').classList.add('hidden');
  if(running) renderer.domElement.requestPointerLock();
}
function openPause() {
  if(!running || panelOpen) return;
  $('pauseScreen').classList.remove('hidden');
}
function resumeGame() {
  $('pauseScreen').classList.add('hidden');
  if(running) renderer.domElement.requestPointerLock();
}
function currentTarget() {
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  raycaster.far=hotbarItems[selected]==='spear'?9:6;
  const hits=raycaster.intersectObjects(worldObjects,false);
  return hits.length?hits[0]:null;
}
function blockAtHit(hit,inside=true) {
  const n=hit.face.normal;
  const offset=inside?-.02:.02;
  return [
    Math.round(hit.point.x+n.x*offset),
    Math.round(hit.point.y+n.y*offset),
    Math.round(hit.point.z+n.z*offset)
  ];
}
function mineBlock() {
  const hit=currentTarget(); if(!hit) return;
  const [x,y,z]=blockAtHit(hit,true);
  const type=getBlock(x,y,z);
  if(type==='air'||type==='bedrock') return;
  const drop=blockInfo[type]?.drop;
  if(drop) inventory[drop]=(inventory[drop]||0)+1;
  setBlock(x,y,z,'air');
  drawHotbar();
}
function placeBlock() {
  const item=hotbarItems[selected];
  if(item==='spear') return;
  if((inventory[item]||0)<=0) return;
  const hit=currentTarget(); if(!hit) return;
  const [x,y,z]=blockAtHit(hit,false);
  if(getBlock(x,y,z)!=='air') return;
  if(Math.abs(player.x-x)<.8 && Math.abs(player.z-z)<.8 && player.y-.9<y+.5 && player.y+.9>y-.5) return;
  setBlock(x,y,z,item);
  inventory[item]--;
  drawHotbar();
}
function handleMouse(e) {
  if(!locked || panelOpen || !running) return;
  if(e.button===0) mineBlock();
  else if(e.button===2) placeBlock();
}
function updatePlayer(dt) {
  const forward=(pressed.KeyW||pressed.ArrowUp?1:0)-(pressed.KeyS||pressed.ArrowDown?1:0);
  const side=(pressed.KeyD||pressed.ArrowRight?1:0)-(pressed.KeyA||pressed.ArrowLeft?1:0);
  const mag=Math.hypot(forward,side)||1;
  const speed=(pressed.ShiftLeft||pressed.ShiftRight)?9:5.2;
  const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)/mag*speed*dt;
  const dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)/mag*speed*dt;
  const oldX=player.x,oldZ=player.z;
  player.x+=dx; if(blockCollision(player.x,player.y,player.z)) player.x=oldX;
  player.z+=dz; if(blockCollision(player.x,player.y,player.z)) player.z=oldZ;
  if(pressed.Space && player.grounded) {player.vy=7.2;player.grounded=false;pressed.Space=false;}
  const oldY=player.y;
  player.vy-=19*dt;
  player.y+=player.vy*dt;
  if(blockCollision(player.x,player.y,player.z)) {
    player.y=oldY;
    if(player.vy<0) player.grounded=true;
    player.vy=0;
  } else player.grounded=false;
  player.x=Math.max(-WORLD_SIZE/2+1,Math.min(WORLD_SIZE/2-1,player.x));
  player.z=Math.max(-WORLD_SIZE/2+1,Math.min(WORLD_SIZE/2-1,player.z));
  if(player.y<MIN_Y-5) {
    player.x=0;player.z=0;player.y=terrainHeight(0,0)+1.42;player.vy=0;
  }
  camera.position.set(player.x,player.y+.55,player.z);
  camera.rotation.set(pitch,yaw,0);
}
function updateSlimes(dt) {
  for(const slime of slimes) {
    const data=slime.userData;
    data.angle+=Math.sin(clockTime*.45+data.phase)*.22*dt;
    const nx=slime.position.x+Math.sin(data.angle)*data.speed*dt;
    const nz=slime.position.z+Math.cos(data.angle)*data.speed*dt;
    if(Math.abs(nx)<WORLD_SIZE/2-3 && Math.abs(nz)<WORLD_SIZE/2-3) {
      const h=terrainHeight(Math.round(nx),Math.round(nz));
      slime.position.x=nx; slime.position.z=nz; data.baseY=h+.5;
    }
    slime.position.y=data.baseY+Math.abs(Math.sin(clockTime*2.2+data.phase))*.12;
    slime.rotation.y=-data.angle;
  }
}
function updateDayNight(dt) {
  clockTime+=dt;
  const sunlight=(Math.sin(clockTime*.035)+1)/2;
  const brightness=.2+sunlight*.8;
  sun.intensity=.25+1.45*brightness;
  hemi.intensity=.55+1.15*brightness;
  sun.position.set(Math.cos(clockTime*.035)*38,18+sunlight*45,Math.sin(clockTime*.035)*35);
  const day=new THREE.Color(0x8cc5e8),night=new THREE.Color(0x101b32);
  const sky=night.clone().lerp(day,brightness);
  scene.background.copy(sky); scene.fog.color.copy(sky);
}
function animate(now) {
  requestAnimationFrame(animate);
  const dt=Math.min((now-lastTime)/1000||0,0.04);
  lastTime=now;
  if(locked && running && !panelOpen) updatePlayer(dt);
  updateSlimes(dt);
  updateDayNight(dt);
  renderer.render(scene,camera);
  frameCount++;
  if(now-fpsAt>1000) {
    $('fps').textContent=frameCount+' FPS';
    frameCount=0;fpsAt=now;
    $('coords').textContent=Math.floor(player.x)+', '+Math.floor(player.y)+', '+Math.floor(player.z);
  }
  if(now-saveAt>12000 && running) {saveWorld();saveAt=now;}
}
function startGame() {
  running=true;
  $('startScreen').classList.add('hidden');
  renderer.domElement.requestPointerLock();
}
function applyPack(file) {
  const reader=new FileReader();
  reader.onload=()=>{
    try {
      const data=JSON.parse(String(reader.result));
      if(!data || typeof data!=='object' || !data.colors || typeof data.colors!=='object') throw new Error('missing colors');
      let applied=0;
      for(const [name,color] of Object.entries(data.colors)) {
        if(!['grass','dirt','stone','wood','leaves','planks','sand','coalOre','ironOre','water'].includes(name)) continue;
        if(typeof color!=='string'||!/^#[0-9a-f]{6}$/i.test(color)) continue;
        packColors[name]=color;
        const matName=name==='grass'?'grassTop':name==='wood'?'woodSide':name;
        if(materials[matName]) materials[matName].color.set(color);
        if(name==='grass') materials.grassSide.color.set(color);
        applied++;
      }
      saveWorld();
      $('packStatus').textContent='Applied '+applied+' block color changes. Saved in this browser.';
    } catch(e) {
      $('packStatus').textContent='That file is not a valid BlockWorld color pack.';
    }
  };
  reader.readAsText(file);
}

document.addEventListener('keydown',e=>{
  pressed[e.code]=true;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  if(/^Digit[1-8]$/.test(e.code)) {selected=Number(e.code.slice(5))-1;drawHotbar();}
  if(e.code==='KeyE' && running && !panelOpen) showInventory();
  else if(e.code==='Escape' && panelOpen) hideInventory();
});
document.addEventListener('keyup',e=>{pressed[e.code]=false;});
document.addEventListener('mousemove',e=>{
  if(!locked||panelOpen) return;
  yaw-=e.movementX*.0022;
  pitch-=e.movementY*.0022;
  pitch=Math.max(-1.52,Math.min(1.52,pitch));
});
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===renderer?.domElement;
  if(!locked && running && !panelOpen) openPause();
});
document.addEventListener('mousedown',handleMouse);
document.addEventListener('contextmenu',e=>e.preventDefault());
$('playBtn').addEventListener('click',startGame);
$('resumeBtn').addEventListener('click',resumeGame);
$('pauseSaveBtn').addEventListener('click',()=>{saveWorld();resumeGame();});
$('closeInventory').addEventListener('click',hideInventory);
$('packFile').addEventListener('change',e=>{if(e.target.files[0])applyPack(e.target.files[0]);e.target.value='';});
$('saveBtn').addEventListener('click',saveWorld);
$('fullscreenBtn').addEventListener('click',()=>{
  if(!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});
window.addEventListener('resize',()=>{
  if(!camera||!renderer) return;
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});
window.addEventListener('beforeunload',saveWorld);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveWorld();});

drawHotbar();
if(initThree()) {
  requestAnimationFrame(animate);
}

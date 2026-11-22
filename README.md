# BlockWorld — classic-style 3D voxel sandbox

An original browser-playable voxel building game with a classic low-resolution pixel-art look. It is not the official Minecraft game and does not include Mojang assets.

## Play

Enable **Settings → Pages → Deploy from a branch → main → /(root)**. Open the GitHub Pages URL. An internet connection is required to load the Three.js engine from jsDelivr.

## Controls

| Input | Action |
|---|---|
| WASD | Walk |
| Mouse | Look around |
| Space | Jump |
| Shift | Sprint |
| Hold left click | Mine the block under the crosshair |
| Right click | Place selected block |
| 1–9 | Select a hotbar slot |
| E | Open inventory and crafting |
| Esc | Release mouse / pause |

## Features in this version

- Classic 16×16 pixel-style textures for grass, dirt, stone, logs, leaves, planks, sand and ores
- Procedural hills, beaches, trees, water, clouds, sun and moon with a day/night lighting cycle
- Chunk-based mesh rendering that draws exposed block faces instead of creating a separate 3D object for each cube
- First-person movement, gravity, collision, jumping and sprinting
- Hold-to-mine progress, block placement and a nine-slot hotbar
- Inventory and crafting recipes for planks, sticks, wooden/stone pickaxes and wooden/stone shovels
- Peaceful wandering slime creatures
- Browser-local world saves and simple JSON colour resource packs

## Simple colour packs

Import a JSON file from the inventory, for example:

```json
{"colors":{"grass":"#55aa44","dirt":"#805332","stone":"#999999","wood":"#79502e","leaves":"#267a35","water":"#398ed1"}}
```

This is BlockWorld's own simple recolour format. Standard Minecraft Java/Bedrock resource packs and arbitrary code mods are not yet supported.

## Current limitations

This remains an early single-player browser game. It does not yet include multiplayer hosting, a full mod loader, caves, villages, survival hunger/health or all Minecraft crafting recipes. The world saves in the browser where you play it.

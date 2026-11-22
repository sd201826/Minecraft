# BlockWorld (Minecraft-inspired voxel sandbox)

A browser-playable, original voxel sandbox prototype built with Three.js. It is not the official Minecraft game and does not contain Mojang assets.

## Run
Enable GitHub Pages: **Settings → Pages → Deploy from a branch → main → /(root) → Save**. Then open the Pages URL GitHub displays. Three.js is loaded from jsDelivr, so the game needs an internet connection.

## Controls
- WASD: move · Mouse: look · Space: jump · Shift: sprint
- Left click: mine · Right click: place
- 1–6: select hotbar block · E: inventory/resource-pack panel · Esc: release mouse

## Simple resource packs
The inventory panel accepts a JSON file such as:
```json
{"colors":{"grass":"#55aa44","dirt":"#805332","stone":"#999999","wood":"#79502e"}}
```
This prototype supports simple block recolors only. It does not yet load Java/Bedrock resource-pack formats or arbitrary code mods.

## Implemented
Procedural voxel terrain, trees, water, ore-colored blocks, first-person movement, mining, placing, hotbar and JSON color packs.

## Not implemented yet
Multiplayer/server hosting, persistent worlds, crafting, mobs, full mod compatibility, advanced chunk streaming and a full version selector. This is an early playable prototype, not a complete Minecraft replacement.

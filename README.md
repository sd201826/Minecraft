# BlockWorld — 3D Voxel Sandbox

BlockWorld is an original browser-based 3D block-building game. It is a playable prototype, not a screenshot and not the official Minecraft game.

## Play it

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose branch **main** and folder **/(root)**, then Save.
4. Open the Pages URL GitHub displays. The first load needs an internet connection to load the Three.js 3D engine.

## Controls

| Key / input | Action |
|---|---|
| WASD | Walk |
| Mouse | Look around |
| Space | Jump |
| Shift | Sprint |
| Left click | Mine the block you are looking at |
| Right click | Place the selected block |
| 1–8 | Select a hotbar slot |
| E | Open inventory |
| Esc | Pause / release mouse |
| Spear slot | Reach farther when mining |

## In this build

- Real-time 3D first-person world made from voxel blocks
- Procedural hills, beaches, water, trees, stone, coal and iron ore
- Chunk-based mesh rendering that draws exposed block faces instead of creating a separate 3D object for every cube
- Player collision, gravity, jumping, sprinting and mouse-look
- Mining, placing, inventory and an eight-slot hotbar
- Peaceful wandering slime creatures
- Day/night lighting
- Local browser saves for placed/mined blocks, player position and inventory
- Importable BlockWorld JSON color packs

## Color resource packs

Create a file such as `my-pack.json`:

```json
{
  "colors": {
    "grass": "#55aa44",
    "dirt": "#805332",
    "stone": "#999999",
    "wood": "#79502e",
    "leaves": "#267a35",
    "water": "#398ed1"
  }
}
```

Open the inventory with **E**, then choose the JSON file under **Load a color resource pack**. This is a small BlockWorld format; it does not load standard Java or Bedrock resource packs.

## Current limits

This is an early single-player browser game. It does not yet include multiplayer servers, a full mod loader, crafting, survival hunger/health, or compatibility with Minecraft Java/Bedrock mods. Do not install anything: the game runs in the browser once GitHub Pages is enabled.

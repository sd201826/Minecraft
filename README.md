# MINECRAFT — Classic Creative

A self-contained, single-player browser voxel builder inspired by the simple creative-building style of Minecraft Classic. This is an independent fan project using original code and procedurally generated pixel textures. It is not the official Minecraft game and does not use Mojang/Microsoft source code or art assets.

## Play

Enable **Settings → Pages → Deploy from a branch → main → /(root)**. Open the GitHub Pages URL. The browser loads Three.js from jsDelivr, so an internet connection is required.

## Controls

| Input | Action |
|---|---|
| WASD | Move |
| Mouse | Look |
| Space | Jump |
| Left click | Instantly break the targeted block |
| Right click | Place the selected block |
| Middle click | Pick the targeted block into the selected slot |
| 1–9 | Select a hotbar slot |
| Mouse wheel | Cycle hotbar slots |
| B | Open the Select block panel |
| E | Open the Select block panel (alternate key) |
| F | Toggle distance fog |
| Esc | Pause / resume |

## Included

- First-person, single-player creative building
- 9-slot classic-style hotbar with original pixel-textured block thumbnails
- Translucent **Select block** palette with 32 selectable blocks
- Instant block breaking and unlimited block placement
- Selectable and breakable water blocks
- 128×128 generated terrain with hills, trees, beach areas, water and ore blocks
- Chunk-mesh rendering and view-distance fog toggle
- 16×16 procedural pixel textures for blocks
- Browser-local world saving and custom JSON block-colour packs
- Fullscreen support

## Custom colour packs

Open **B → Custom colour pack** and load a JSON file, for example:

```json
{"colors":{"grass":"#55aa44","dirt":"#805332","stone":"#999999","wood":"#79502e","leaves":"#267a35"}}
```

The colour-pack format changes supported block colours. It does not load official Minecraft Java/Bedrock resource packs or mods.

## Scope

This release is a finished small single-player creative sandbox, not a recreation of all Minecraft editions. It does not include multiplayer hosting, mobs, survival, crafting, redstone, or third-party mod loading.

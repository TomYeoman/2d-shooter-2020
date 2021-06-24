# Overview

IO game boilerplate, featuring -

- Client and server side phaser support
- Full typescript support across server and client
- Mutliplayer networking powered by nengijs - https://github.com/timetocode/nengi
- Simple lobby system to get you started

## Structure

**Frontend**
- Create react app (typescript)
- Redux local state (WIP)
- Phaser for UI
  - Demo using a tilemap, with collissions
- Nengi for multiplayer networking

**Backend**
- Authorative server, all movement and collissions calculated here
- Communication with frontend powered by nengi, with a simple express API also if required
- Full typescript support

**Common**
- Define re-useable data between frontend / backend (for example types, messages, entities etc)

## Getting started

My development flow is as follows -
- Open `frontend` folder, run `yarn start`
- Open `server` folder, run `yarn debug`

They should now both automatically hot reload whenever you make a relevant change in the `frontend` / `server` directory.

You can open a single instance of VS code at the root directory (I.E at the same level as this README), and development should work correctly.

If you'd like to debug either the server or frontend via VS code, you should open that folder on its own, and you'll then be able to make use of the debug scripts defined in `launch.json` in each folder.

Currently changes to common require a manual reload on `server` - fix will come soon for this / feel free to open a PR

WIP
- Add client side prediction (simple providing your movement is deterministic on the server, will add example soon)



Game Ideas
- Lights out - Path to exit but lights come on / off randomly
- Frogger
- Obstacle coming at you, have to move through the shape (hole in the wall)
- Take the hill - Get to top of hill with obstacles coming down
- Simon Says ( Random numbers on board, he might say 2x15, or a color etc)
- Zombie survival - Random spawns of bots spawn, attack them and survive
- FFA - most kills
- Battle Royale
- Boss Survival
- Planet Col - https://mrmuffinman61.itch.io/planet-colonizer

Zombies -
 - one in X drops pet, or other special for collection log



Main screen
- ANimated background of players in game

Sound ideas
- Door open 3 (sci fi doors ) - weapon upgrade
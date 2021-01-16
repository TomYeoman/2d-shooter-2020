Daily Goals

Goal - Have project setup
    - Front end has a game canvas drawn with a player that can move / turn


Goal - Have basic networked movement
    - Follow the netowrk guide, implement
        -Tween, lerp, interpolation, prediction

Goal - Able to kill another player
    - Create basic basic
    - Blood sprite displays after death
    - Players score incremenets
    - Respawn after death



Fonts
https://fonts.google.com/specimen/Bungee?category=Display,Monospace&preview.text=Game%20Loading&preview.text_type=custom#standard-styles
https://fonts.google.com/specimen/Goldman?category=Display,Monospace&preview.text=Game%20Loading%20GAME%20LOADING&preview.text_type=custom
https://fonts.google.com/specimen/Staatliches?category=Display,Monospace#standard-styles



What to do

Setup
    - Setup basic server
        - Create typescript starter project
        - Add socketIO
    - Setup basic frontend
        - Create react app, new typescript project
        - Add phaser, and socket IO
Wiring up
    - Setup communication between front-end and server
Game Building
    - Create our first map in Tiled
    - Update front-end to render the map
    - Get basic movement, with server as authorative working
        - On connect, have server generate the user an ID and entity data,
        then send the entity ID to the client
        - On every server game tick, send the world state to the user, so they are able to
        render all entities (themselves, and other players at this point)
        - On every client tick, check for any input. Send over the player intention (direction) to the server
          - Have the server update the entity related to this player. This means on next game tick, all clients will recieve the updated position of this player
Enhanced network code
    - Add the concepts discussed here https://www.gabrielgambetta.com/client-server-game-architecture.html
      - Client side prediction
      - Server reconciliation
      - Entity Interpolation
Adding Collisions
    To recap. We currently have
        - A client with phaser running, able to perform client side prediction, and server reconcilation, aswell as entity interpolation
        - A server, which is the source of truth for all actions in the game

    Now it's time to handle collisions. We'll need to run Phaser on the server to begin this journey.



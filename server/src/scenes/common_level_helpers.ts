import PlayerEntity from "../../../common/entity/PlayerEntity";
import PlayerGraphicServer from "../../../common/graphics/PlayerGraphicServer";
import { ExtendedNengiTypes } from "../../../common/types/custom-nengi-types";

export const createPlayerEntity = (
    spawnX:number,
    spawnY:number,
    nengiInstance: ExtendedNengiTypes.Instance,
    worldLayer:  Phaser.Tilemaps.StaticTilemapLayer

) => {

    const entitySelf = new PlayerEntity(spawnX, spawnY);
    nengiInstance.addEntity(entitySelf);

    // Create a new phaser bot and link to entity, we'll apply physics to for each path check
    const playerGraphic = new PlayerGraphicServer(this, worldLayer, nengiInstance, entitySelf.x, entitySelf.y, entitySelf.nid);
    playerGraphics.set(entitySelf.nid, playerGraphic);

    // Tell the client about the new entity ID they now control for this level
    nengiInstance.message(new Identity(entitySelf.nid), client);

    // Update self, to be new version in level
    entitySelf.client = client;
    client.entitySelf = entitySelf;
    client.entityPhaser = playerGraphic;

    client.positions = [];
    client.name = clientName;
    client.positions = [];

    // define the view (the area of the game visible to this client, all else is culled)
    client.view = {
        x: entitySelf.x,
        y: entitySelf.y,
        halfWidth: 99999,
        halfHeight: 99999
    };
}
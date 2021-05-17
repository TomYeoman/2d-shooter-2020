import React, { useState } from "react";

import { useAppSelector, useAppDispatch } from "../../app/hooks";

export function GameInfo() {
  const gameInfo = useAppSelector((state) => state.gameInfo);

  return (
    <div className="flex-col p-2 fixed top-0 w-80 select-none">
            <div className={`
                m-1 border-2 bg-opacity-50 border-grey bg-gray-600"
            `}>
        {/* {gameInfo.currentWave} */}
        <div className="p-2 border-bottom border-gray-600">
            Game State          : {gameInfo.gameStatus}
        </div>
        <div className="p-2 border-bottom border-gray-600">
        Zombies Remaining          : {gameInfo.zombiesRemaining}
        </div>
        <div className="p-2 border-bottom border-gray-600">
        Zombies Killed          : {gameInfo.zombiesKilled}
        </div>
        <div className="p-2 border-bottom border-gray-600">
        Zombies Alive          : {gameInfo.zombiesAlive}
        </div>
        <div className="p-2 border-bottom border-gray-600">
        Players          : {gameInfo.playersAlive}
        </div>
            {/* Current wave        : ${zombieWaveMessage.currentWave}
            Zombies Remaining   : ${zombieWaveMessage.zombiesRemaining}
            Zombies Killed      : ${zombieWaveMessage.zombiesKilled}
            Zombies Alive       : ${zombieWaveMessage.zombiesAlive}
            Players             : ${zombieWaveMessage.playersAlive} / ${zombieWaveMessage.playersTotal} */}
          </div>
    </div>
  );
}

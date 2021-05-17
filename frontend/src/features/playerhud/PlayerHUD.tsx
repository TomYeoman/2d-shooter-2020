import React, { useState } from "react";

import { useAppSelector, useAppDispatch } from "../../app/hooks";

export function PlayerHUD() {
  const playerHud = useAppSelector((state) => state.playerHUD);

  let className="bg-green-500 bg-opacity-30 "

  if (playerHud.health >30 && playerHud.health <70) {
    className="bg-yellow-500 bg-opacity-30 "
  }

  if (playerHud.health <30) {
    className="bg-red-500 bg-opacity-30 "

  }

  return (
    <div className="text-white fixed bottom-2 right-2 w-80 select-none bg-opacity-50 border-grey bg-gray-600 m-1 border-2">
      {/* <div className="shadow w-full bg-grey-light mt-2"> */}
      <span className="text-xs font-semibold py-1 px-2 uppercase rounded-full text-amber-600 bg-amber-200">
            Health
          </span>
      <div style={{ width: playerHud.health + "%" }} className={`${className} text-xs leading-none py-1 text-center text-white`}>
          {playerHud.health}
        {/* </div> */}
      </div>

      {/* <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-amber-600 bg-amber-200">
              Health
            </span>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-amber-200"></div>
        </div>
      </div> */}
    </div>
  );
}

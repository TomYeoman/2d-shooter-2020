import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import ClientHudMessage from '../../../../common/message/ClientHudMessage';
import { RootState, AppThunk } from '../../app/store';

export interface PlayerHUD extends ClientHudMessage{}

const initialState: PlayerHUD = {
   health: 100,
   ammo: "",
   gunName: "",
};


export const playerHUDSlice = createSlice({
  name: 'gameinfo',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    updatePlayerHUD: (state, action: PayloadAction<PlayerHUD>) => {

      console.log({healthRecieved: action.payload.health})
      return {
        ammo: action.payload.ammo,
        gunName: action.payload.gunName,
        health: action.payload.health,
        // ...state,
      }
    },
  },
});

export const { updatePlayerHUD } = playerHUDSlice.actions;

export default playerHUDSlice.reducer;
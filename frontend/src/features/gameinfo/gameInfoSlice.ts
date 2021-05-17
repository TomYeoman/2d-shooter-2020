import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import ZombieWaveMessage from '../../../../common/message/ZombieWaveMessage';
import { RootState, AppThunk } from '../../app/store';

export interface GameInfo extends ZombieWaveMessage{}

const initialState: GameInfo = {
  currentWave: 0,
  waveSize: 0,
  zombiesRemaining: 0,
  zombiesKilled: 0,
  zombiesAlive: 0,
  playersAlive: 0,
  playersTotal: 0,
  gameStatus : "N/A"
};


export const gameInfoSlice = createSlice({
  name: 'gameinfo',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    updateGameInfo: (state, action: PayloadAction<GameInfo>) => {
      return {...state, ...action.payload}
    },
  },
});

export const { updateGameInfo } = gameInfoSlice.actions;

// export const changeToSlot = (index: number) => {
//     changeSlot(index)
// }

export default gameInfoSlice.reducer;
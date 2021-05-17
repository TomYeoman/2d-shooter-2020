import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';
import toolbarReducer from '../features/toolbar/toolbarSlice';
import gameinfoReducer from '../features/gameinfo/gameInfoSlice';
import playerHudReducer from '../features/playerhud/playerHUDSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    toolbar: toolbarReducer,
    gameInfo: gameinfoReducer,
    playerHUD: playerHudReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
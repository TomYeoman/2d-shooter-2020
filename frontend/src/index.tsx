import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import Main from './game/Main';
import { Counter } from './features/counter/Counter';

ReactDOM.render(
  <React.StrictMode>
        <Provider store={store}>

      <Main />
      <Counter/>
      </Provider>

  </React.StrictMode>,
  document.getElementById('root')
);

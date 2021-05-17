import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import Main from './game/Main';
import { Toolbar } from './features/toolbar/Toolbar';
import "./assets/main.css";

ReactDOM.render(
  <React.StrictMode>
        <Provider store={store}>

      <Main />
      <Toolbar/>
      </Provider>

  </React.StrictMode>,
  document.getElementById('root')
);

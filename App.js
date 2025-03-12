import React from 'react';
import AppNavigation from './AppNavigation';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
const App = () => (
  <Provider store={store}>
  <AppNavigation />
</Provider>
);

export default App;


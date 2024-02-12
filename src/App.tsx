import React from 'react';
import './App.css';

import BarGraph from "./components/BarGraph";
import FileInput from "./components/FileInput";
import Reducer, * as Actions from "./reducers/App";

function App() {
  const [state, dispatch] = Reducer();

  const importFile = (file:File) => dispatch(Actions.importFile(file));

  return (
    <div className="App">
      <header className="App-header">
        <FileInput busy={state.busy} importFile={importFile}/>
        <BarGraph/>
      </header>
    </div>
  );
}

export default App;

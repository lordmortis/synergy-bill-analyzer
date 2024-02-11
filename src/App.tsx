import React from 'react';
import './App.css';
import BarGraph from "./components/BarGraph";
import FileInput from "./components/FileInput";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <FileInput/>
        <BarGraph/>
      </header>
    </div>
  );
}

export default App;

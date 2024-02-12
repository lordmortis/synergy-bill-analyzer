import React from "react";

interface IProps {
  busy: boolean;
  filename: string | null;
  recordCount: number;
  importFile: (file:File)=>void;
}

export default function FileInput(props:IProps) : React.ReactElement {
  function onFileChosenHandler(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files == null || event.target.files.length === 0)  {
      return;
    }

    props.importFile(event.target.files[0]);
  }

  if (props.busy) {
    return <div>Synergy Data<br/>Importing:{props.filename} {props.recordCount} records</div>
  } else {
    return <div>
      Synergy Data<br/>
      <input type='file' id='file' className='input-file' accept='.csv' onChange={onFileChosenHandler}/>
    </div>
  }
}
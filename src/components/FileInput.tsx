import React from "react";

interface IProps {
  busy: boolean;
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
    return <div>Importing:{"A FILE"} {0} records</div>
  } else {
    return <div>
      <input type='file' id='file' className='input-file' accept='.csv' onChange={onFileChosenHandler}/>
    </div>
  }
}
import React, {useState, useEffect, useRef, RefObject, useMemo} from "react";

import * as SynergyImporter from "../worker/SynergyImport";

export default function FileInput() : React.ReactElement {
  const importer : Worker = useMemo(
    () => new Worker( new URL("../worker/SynergyImport.ts", import.meta.url)),
    []
  );
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string|null>(null);
  const [recordCount, setRecordCount] = useState(0);

  function onFileChosenHandler(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files == null || event.target.files.length === 0)  {
      console.log("Error! no files")
      return;
    }

    importer.postMessage(event.target.files[0]);
  }

  useEffect(() => {
    if (window.Worker) {
      importer.onmessage = (e:MessageEvent<SynergyImporter.Message>) => {
        const message:SynergyImporter.Message = e.data;
        setFileName(message.state.currentFile);
        setBusy(message.state.busy);
        setRecordCount(message.importCount);
      }
    }
  }, [importer]);

  if (busy) {
    return <div>Importing:{fileName} {recordCount} records</div>
  } else {
    return <div>
      <input type='file' id='file' className='input-file' accept='.csv' onChange={onFileChosenHandler}/>
    </div>
  }
}
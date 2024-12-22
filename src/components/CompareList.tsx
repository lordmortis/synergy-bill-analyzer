import React, {ChangeEvent, MouseEvent} from "react";
import {CompareRecords} from "../reducers/Types";

interface IProps {
  currentDate: Date | null;
  records: CompareRecords | null;
  selectedRecord: string | null;
  selectRecord: (name: string | null) => void;
  storeDate: (date:Date, name:string)=>void;
  deleteDate: (id:string) => void;
}

function renderStorageForm(props: IProps,
                           storageName: string,
                           setStorageName: (value: (((prevState: string) => string) | string)) => void) {
  function updateName(event:ChangeEvent<HTMLInputElement>) { setStorageName(event.target.value); }
  function handleClick(_:MouseEvent<HTMLButtonElement>) { props.storeDate(props.currentDate!, storageName); }
  return <div>
    <input type='text' value={storageName} onChange={updateName}/>
    <button disabled={storageName.length <= 3} onClick={handleClick}>Store</button>
  </div>
}

function renderClearSelected(props: IProps) {
  function handleClick(_:MouseEvent<HTMLButtonElement>) { props.selectRecord(null); }
  return <button onClick={handleClick}>Clear Selected</button>;
}


function renderButton(props: IProps,
                      key: string,
                      deleteConfirm: string,
                      setDeleteConfirm: (value: (((prevState: string) => string) | string)) => void){
  function handleSelectClick(_:MouseEvent<HTMLButtonElement>) { props.selectRecord(key); }
  function handleDeleteFinalClick(_:MouseEvent<HTMLButtonElement>) { props.deleteDate(key); }
  function handleDeleteFirstClick(_:MouseEvent<HTMLButtonElement>) { setDeleteConfirm(key); }
  if (deleteConfirm === key) {
    return <button onClick={handleDeleteFinalClick}>Really Delete {key} ?</button>
  }

  return <div>
    <button disabled={props.selectedRecord === key} onClick={handleSelectClick}>{key}</button>
    <button onClick={handleDeleteFirstClick}>Delete</button>
  </div>

}

export default function CompareList(props:IProps) : React.ReactElement {
  const parts:React.ReactElement[] = [];
  const [storageName, setStorageName] = React.useState("");
  const [deleteConfirm, setDeleteConfirm] = React.useState("");

  if (props.currentDate != null) parts.push(renderStorageForm(props, storageName, setStorageName));
  if (props.selectedRecord != null) parts.push(renderClearSelected(props));
  props.records?.forEach((_, key) => parts.push(renderButton(props, key, deleteConfirm, setDeleteConfirm)));
  return <div>{parts}</div>;
}
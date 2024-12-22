import React, {ChangeEvent, MouseEvent} from "react";
import {CompareRecords} from "../reducers/Types";

interface IProps {
  currentDate: Date | null;
  records: CompareRecords | null;
  storeDate: (date:Date, name:string)=>void;
  deleteDate: (id:string) => void;
}

function renderStorageForm(currentDate: Date,
                           storageName: string,
                           setStorageName: (value: (((prevState: string) => string) | string)) => void,
                           storeDate: (date:Date, name:string) => void){
  function updateName(event:ChangeEvent<HTMLInputElement>) { setStorageName(event.target.value); }
  function handleClick(_:MouseEvent<HTMLButtonElement>) { storeDate(currentDate, storageName); }
  return <div>
    <input type='text' value={storageName} onChange={updateName}/>
    <button disabled={storageName.length <= 3} onClick={handleClick}>Store</button>
  </div>
}

function renderButton(key: string,
                      deleteConfirm: string,
                      setDeleteConfirm: (value: (((prevState: string) => string) | string)) => void,
                      deleteDate: (id: string) => void) {
  function handleDeleteFinalClick(_:MouseEvent<HTMLButtonElement>) { deleteDate(key); }
  function handleDeleteFirstClick(_:MouseEvent<HTMLButtonElement>) { setDeleteConfirm(key); }
  if (deleteConfirm === key) {
    return <button onClick={handleDeleteFinalClick}>Really Delete {key} ?</button>
  }

  return <div>
    <button>{key}</button>
    <button onClick={handleDeleteFirstClick}>Delete</button>
  </div>

}

export default function CompareList(props:IProps) : React.ReactElement {
  const parts:React.ReactElement[] = [];
  const [storageName, setStorageName] = React.useState("");
  const [deleteConfirm, setDeleteConfirm] = React.useState("");

  if (props.currentDate != null) parts.push(renderStorageForm(props.currentDate, storageName, setStorageName, props.storeDate));
  props.records?.forEach((_, key) => parts.push(renderButton(key, deleteConfirm, setDeleteConfirm, props.deleteDate)));
  return <div>{parts}</div>;
}
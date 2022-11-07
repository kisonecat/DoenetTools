import React, { useRef, useState } from "react";
import {
    useSetRecoilState,
  } from "recoil";
import { pageToolViewAtom } from '../NewToolRoot';
import "../doenet.css";
import Button from "../../../_reactComponents/PanelHeaderComponents/Button";
import { checkIfUserClearedOut } from "../../../_utils/applicationUtils";

export default function DoenetProfile(props) {
  const setPageToolView = useSetRecoilState(pageToolViewAtom);
  const [signedIn,setSignedIn] = useState(null);
  let checkingCookie = useRef(false);

  //Only ask once
  if (!checkingCookie.current){
    checkingCookie.current = true;
    checkIfUserClearedOut().then(({cookieRemoved})=>{
      setSignedIn(cookieRemoved);
    })
  }
console.log("signedIn",signedIn)
  if (signedIn == null){
    return null;
  }
    let messageJSX = null;

    if (signedIn) {
      messageJSX = <>
                  <h2>You are NOT signed in</h2>
                  <Button value="Sign in" onClick={() =>{
                    setPageToolView({page: 'signout', tool: '', view: ''})
                    window.location.href = '/signin';
                    }}/>

                  </>
    }else{
      messageJSX = <>
                  <h2>You are signed in</h2>
                  <Button value="Sign out" onClick={() =>{setPageToolView({page: 'signout', tool: '', view: ''})}}/>
                  </>
    }

  return (<div style = {props.style}>
          <div
            style={{
              ...props.style,
              border: '1px solid var(--mainGray)',
              borderRadius: '20px',
              margin: 'auto',
              marginTop: '10%',
              padding: '10px',
              width: '50%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'center',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              {messageJSX}
            </div>
          </div>
          </div>
  );



}
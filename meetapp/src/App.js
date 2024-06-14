import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import Editor, { Monaco, OnChange, } from "@monaco-editor/react";

import Peer from 'peerjs';

const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '5000'
});

const socket = io.connect('http://localhost:5000');

function App() {
  const uniqueId = uuidv4();
  const [userName, setUserName] = useState('');
  const [text, setText] = useState('');
  const roomId = 'your_static_room_id'; // Static room ID
  const userId = uniqueId; // Use uniqueId as user ID

  const [myVideoStream, setMyVideoStream] = useState(null);
  const [peers, setPeers] = useState({});
  const videoGridRef = React.useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {
      setMyVideoStream(stream);
      addVideoStream(stream);

      myPeer.on('call', call => {
        call.answer(stream);
        call.on('stream', userVideoStream => {
          addVideoStream(userVideoStream, call.peer);
        });
      });

      socket.emit('ready');

      socket.on('userJoined', (userId, username) => {
        connectToNewUser(userId.userId, stream);
      });
    });

    myPeer.on('open', userId => {
      socket.emit('joinRoom', { userId, userName, room: roomId });
    });

    socket.on('updateText', newText => {
      setText(newText);
    });

    return () => {
      socket.off('updateText');
    };
  }, []);

  const addVideoStream = (stream, userId) => {
    const existingVideo = document.getElementById(userId);
    if (existingVideo) {
      return; // If video element already exists, do nothing
    }

    const video = document.createElement('video');
    video.classList.add('styled-video');
    video.srcObject = stream;
    video.id = userId;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    videoGridRef.current.appendChild(video);
  };

  const connectToNewUser = (userId, stream) => {
    if (peers[userId]) {
      return; // If already connected, do nothing
    }

    const call = myPeer.call(userId, stream);
    call.on('stream', userVideoStream => {
      addVideoStream(userVideoStream, userId);
    });
    call.on('close', () => {
      const video = document.getElementById(userId);
      if (video) {
        video.remove();
      }
      // Remove the peer from the peers state
      setPeers(prevPeers => {
        delete prevPeers[userId];
        return { ...prevPeers };
      });
    });

    // Store the call object in the peers state
    setPeers(prevPeers => ({
      ...prevPeers,
      [userId]: call
    }));
  };

  const handleChange = (e, a) => {
    // console.log(object)
    setText(e);
    socket.emit('changeText', { text: e, user: userName, room: roomId });
  };

  return (
    <div className="meeting_container">
      <div className='meeting_details'>
        <h4 style={{ padding: '20px' }}>Meeting with Om</h4>
      </div>
      <div className='main_meeting_container'>
        <div className='main_meeting_container_editor'>

          <div className="main_meeting_container_editor_code">
            <div>
              <Editor
                height="70vh"
                className='editor'
                // defaultLanguage={language}
                language='c'
                value={text}
                theme="vs-dark"
                options={{
                  fontSize: 20,
                  scrollbar: {
                    // Hide horizontal and vertical scrollbars
                    verticalScrollbarSize: 0,
                    horizontalScrollbarSize: 0
                  }
                }}
                onChange={handleChange}
                style={{ overflow: 'hidden' }}
              />
            </div>
          </div>

          <div className='main_meeting_container_editor_output'>
            <p style={{ color: 'grey' }}>//Output will goes here lorem  </p>
          </div>





        </div>

        <div id="video-grid" ref={videoGridRef} />


      </div>
      <div className='code_controls'>
        <button className='run_btn'><i className='fa fa-play'></i> Run code</button>
        <select>
          <option value={'java'}>Java</option>
          <option value={'java'}>C++</option>
          <option value={'java'}>Python</option>
        </select>
      </div>
      <input className="nameTxt" placeholder="Enter Your Name..." type="text" onChange={e => setUserName(e.target.value)} />
      <input placeholder="// Enter Collaborative text" className="inputArea" type="text" value={text} onChange={handleChange} />
      {/* <div id="video-grid" ref={videoGridRef} /> */}
    </div>
  );
}

export default App;

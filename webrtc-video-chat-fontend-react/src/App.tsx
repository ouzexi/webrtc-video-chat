import './App.css'

import IconVideoCall from './assets/videoCall.svg';
import IconAnswer from './assets/answer.svg';
import IconRefuse from './assets/refuse.svg';
import { Fragment, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

enum EventEnum {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  JOIN = 'join',
  CALL = 'call',
  ACCEPT = 'accept',
  OFFER = 'offer',
  ANSWER = 'answer',
  CANDIDATE = 'candidate'
}

const WS_URL = 'localhost:8081';
const ROOM_ID = '001';
let socket: Socket;
let peer: RTCPeerConnection | null = null;
let selfStream: MediaStream | undefined;

function App() {
  const [caller, setCaller] = useState<boolean>(false);
  const [callee, setCallee] = useState<boolean>(false);
  const [calling, setCalling] = useState<boolean>(false);
  const [communicating, setCommunicating] = useState<boolean>(false);
  
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const otherVideoRef = useRef<HTMLVideoElement>(null);

  const handleCandidated = async ({ candidate }: { candidate: RTCIceCandidate }) => {
    await peer?.addIceCandidate(candidate);
  }

  useEffect(() => {
    socket = io(WS_URL);

    socket.on(EventEnum.CONNECTED, () => {
      console.log("ws连接成功...");
      socket.emit(EventEnum.JOIN, ROOM_ID);
    });

    socket.on(EventEnum.CANDIDATE, handleCandidated);
  
    socket.on(EventEnum.DISCONNECTED, handleReset)

  }, [])

  const handleCalled = () => {
    if(!caller) {
      setCallee(true);
      setCalling(true);
    }
  }

  const handleAccepted = async () => {
    if(caller) {
      peer = new RTCPeerConnection();

      handleCommunicate();

      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peer.setLocalDescription(offer);

      const payload = { roomId: ROOM_ID, offer };
      socket.emit(EventEnum.OFFER, payload);
    }
  }

  const handleAnswered = ({ answer }: { answer: RTCSessionDescriptionInit }) => {
    if(caller) {
      peer?.setRemoteDescription(answer);
    }
  }

  useEffect(() => {
    socket.on(EventEnum.CALL, handleCalled);
    
    socket.on(EventEnum.ACCEPT, handleAccepted);
    
    socket.on(EventEnum.ANSWER, handleAnswered);
  }, [caller])

  const handleOffered = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
    if(callee) {
      peer = new RTCPeerConnection();

      await getStream();
      handleCommunicate();

      await peer.setRemoteDescription(offer);

      const answer = await peer.createAnswer();
      peer.setLocalDescription(answer);

      const payload = { roomId: ROOM_ID, answer };
      socket.emit(EventEnum.ANSWER, payload);
    }
  }

  useEffect(() => {
    socket.on(EventEnum.OFFER, handleOffered);
  }, [callee])

  const getStream = async (): Promise<MediaStream>  => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });
  
    selfVideoRef.current!.srcObject = stream;
    selfVideoRef.current!.play();
  
    selfStream = stream;
    return stream;
  }

  const handleCommunicate = () => {
    addTrack();
    onicecandidate();
    ontrack();
    onDisconnected();
  }

  const addTrack = () => {
    selfStream?.getTracks().forEach(track => {
      peer?.addTrack(track, selfStream!);
    });
  }

  // 设置了本地描述开始触发
const onicecandidate = () => {
  peer!.onicecandidate = (event) => {
    if (event.candidate) {
      const payload = { roomId: ROOM_ID, candidate: event.candidate };
      socket.emit(EventEnum.CANDIDATE, payload);
    }
  };
}

const ontrack = () => {
  peer!.ontrack = (event) => {
    if(calling) {
      setCalling(false);
      setCommunicating(true);

      otherVideoRef.current!.srcObject = event.streams[0];
      otherVideoRef.current!.play();
    }
  }
}

const stopTrack = () => {
  selfStream && selfStream.getTracks().forEach(track => {
    track.stop();
  });
}

const onDisconnected = () => {
  peer!.oniceconnectionstatechange = (event: any) => {
    if(event.currentTarget && event.currentTarget.iceConnectionState === EventEnum.DISCONNECTED) {
      handleReset();
    }
  }
}

const handleCall = () => {
  setCaller(true);
  setCalling(true);

  setTimeout(async () => {
    await getStream();
    socket.emit(EventEnum.CALL, ROOM_ID);
  }, 3000)
}

const handleAccept = () => {
  socket.emit(EventEnum.ACCEPT, ROOM_ID);
}

const handleReset = () => {
  stopTrack();

  setCaller(false);
  setCallee(false);
  setCalling(false);
  setCommunicating(false);

  peer = null;
  selfVideoRef.current!.srcObject = null;
  otherVideoRef.current!.srcObject = null;
  selfStream = undefined;

  // peer.close();
  socket.emit(EventEnum.DISCONNECTED, ROOM_ID)
}

  return (
    <main id='card'>
      <section id='card__video'>
        {
          calling && <p id='card__video-tips'>{ caller ? '请求中...' : '有人找你' }</p>
        }
        <video ref={selfVideoRef} style={{'display': (caller && calling) || communicating ? 'block' : 'none'}} id='card__video-self'></video>
        <video ref={otherVideoRef} style={{'display': communicating ? 'block' : 'none'}} id='card__video-other'></video>
      </section>
      <footer id='card__footer'>
        {
          (!calling && !communicating) && <img id='card__icon-call' className='card__icon' title='视频通话' src={IconVideoCall} onClick={handleCall} />
        }
        {
          (calling || communicating) && (
            <Fragment>
              {
                (callee && calling) && <img id='card__icon-answer' className='card__icon' title='接听' src={IconAnswer} onClick={handleAccept} />
              }
              {
                <img id='card__icon-refuse' className='card__icon' title='挂断' src={IconRefuse} onClick={handleReset} />
              }
            </Fragment>
          )
        }
      </footer>
    </main>
  )
}

export default App

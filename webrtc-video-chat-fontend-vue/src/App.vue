<script setup lang="ts">
import IconVideoCall from './assets/videoCall.svg';
import IconAnswer from './assets/answer.svg';
import IconRefuse from './assets/refuse.svg';
import { onMounted, ref } from 'vue';
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

const caller = ref<boolean>(false);
const callee = ref<boolean>(false);
const calling = ref<boolean>(false);
const communicating = ref<boolean>(false);

const selfVideoRef = ref<HTMLVideoElement>();
const otherVideoRef = ref<HTMLVideoElement>();

onMounted(() => {
  socket = io(WS_URL);

  socket.on(EventEnum.CONNECTED, () => {
    console.log("ws连接成功...");
    socket.emit(EventEnum.JOIN, ROOM_ID);
  });

  socket.on(EventEnum.CALL, () => {
    if(!caller.value) {
      callee.value = true;
      calling.value = true;
    }
  });

  socket.on(EventEnum.ACCEPT, async () => {
    if(caller.value) {
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
  });

  socket.on(EventEnum.OFFER, async ({ offer }) => {
    if(callee.value) {
      peer = new RTCPeerConnection();

      await getStream();
      handleCommunicate();

      await peer.setRemoteDescription(offer);

      const answer = await peer.createAnswer();
      peer.setLocalDescription(answer);

      const payload = { roomId: ROOM_ID, answer };
      socket.emit(EventEnum.ANSWER, payload);
    }
  });

  socket.on(EventEnum.ANSWER, ({ answer }) => {
    if(caller.value) {
      peer?.setRemoteDescription(answer);
    }
  });

  socket.on(EventEnum.CANDIDATE, async ({ candidate }) => {
    await peer?.addIceCandidate(candidate);
  });

  socket.on(EventEnum.DISCONNECTED, handleReset)

})

const getStream = async (): Promise<MediaStream>  => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  });

  selfVideoRef.value!.srcObject = stream;
  selfVideoRef.value!.play();

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
    if(calling.value) {
      calling.value = false;
      communicating.value = true;

      otherVideoRef.value!.srcObject = event.streams[0];
      otherVideoRef.value!.play();
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

const handleCall = async () => {
  caller.value = true;
  calling.value = true;

  await getStream();
  socket.emit(EventEnum.CALL, ROOM_ID);
}

const handleAccept = () => {
  socket.emit(EventEnum.ACCEPT, ROOM_ID);
}

const handleReset = () => {
  stopTrack();

  caller.value = false;
  callee.value = false;
  calling.value = false;
  communicating.value = false;

  peer = null;
  selfVideoRef.value!.srcObject = null;
  otherVideoRef.value!.srcObject = null;
  selfStream = undefined;

  // peer.close();
  socket.emit(EventEnum.DISCONNECTED, ROOM_ID)
}
</script>
<template>
  <main id='card'>
    <section id='card__video'>
      <p v-if="calling" id='card__video-tips'>{{ caller ? '请求中...' : '有人找你' }}</p>
        <video ref="selfVideoRef" v-show="(caller && calling) || communicating" id='card__video-self'></video>
        <video ref="otherVideoRef" v-show="communicating" id='card__video-other'></video>
    </section>
    <footer id='card__footer'>
      <img v-if="!calling && !communicating" id='card__icon-call' class='card__icon' title='视频通话' :src="IconVideoCall" @click="handleCall" />
      <template v-if="calling || communicating">
        <img v-if="callee && calling" id='card__icon-answer' class='card__icon' title='接听' :src="IconAnswer" @click="handleAccept"/>
        <img id='card__icon-refuse' class='card__icon' title='挂断' :src="IconRefuse" @click="handleReset"/>
      </template>
    </footer>
  </main>
</template>
<style>
#card {
  position: relative;
  width: 375px;
  height: 700px;
  margin: auto;
  margin-top: 20px;
  border-radius: 8px;
  box-shadow: rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px;
}

#card__video {
  position: relative;
  height: 100%;
}

#card__video #card__video-tips {
  position: relative;
  height: 100%;
  font-size: 24px;
  line-height: 700px;
  text-align: center;
  background-color: #fafafa;
}

#card__video video {
  object-fit: cover;
}

#card__video #card__video-self {
  position: absolute;
  top: 0;
  right: 0;
  width: 40%;
  height: 30%;
  border-radius: 8px;
  box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
}

#card__video #card__video-other {
  width: 100%;
  height: 100%;
}

#card #card__footer {
  position: absolute;
  left: 50%;
  bottom: 20px;
  display: flex;
  gap: 20px;
  transform: translateX(-50%);
}

#card #card__footer .card__icon {
  width: 60px;
  cursor: pointer;
}
</style>
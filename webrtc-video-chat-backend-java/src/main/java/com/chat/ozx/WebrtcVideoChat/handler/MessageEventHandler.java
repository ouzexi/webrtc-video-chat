package com.chat.ozx.WebrtcVideoChat.handler;

import com.chat.ozx.WebrtcVideoChat.config.Event;
import com.chat.ozx.WebrtcVideoChat.payload.AnswerRequest;
import com.chat.ozx.WebrtcVideoChat.payload.CandidateRequest;
import com.chat.ozx.WebrtcVideoChat.payload.OfferRequest;
import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MessageEventHandler {

    @Autowired
    private SocketIOServer server;

    @OnConnect
    public void onConnent(SocketIOClient client) {
        if(client != null) {
            client.sendEvent(Event.CONNECTED);
        }
    }

    @OnDisconnect
    public void onDisconnet(SocketIOClient client) {
        if(client != null) {
            System.out.println("客户端断开ws连接~");
        }
    }

    @OnEvent(value = Event.JOIN)
    public void onJoinEvent(SocketIOClient client, AckRequest request, String roomId) {
        System.out.println("加入" + roomId + "成功~");
        client.joinRoom(roomId);
    }

    @OnEvent(value = Event.CALL)
    public void onCallEvent(SocketIOClient client, AckRequest request, String roomId) {
        server.getRoomOperations(roomId).sendEvent(Event.CALL);
    }

    @OnEvent(value = Event.ACCEPT)
    public void onAcceptEvent(SocketIOClient client, AckRequest request, String roomId) {
        server.getRoomOperations(roomId).sendEvent(Event.ACCEPT);
    }

    @OnEvent(value = Event.OFFER)
    public void onOfferEvent(SocketIOClient client, AckRequest request, OfferRequest offerRequest) {
        server.getRoomOperations(offerRequest.getRoomId()).sendEvent(Event.OFFER, offerRequest);
    }

    @OnEvent(value = Event.ANSWER)
    public void onAnswerEvent(SocketIOClient client, AckRequest request, AnswerRequest answerRequest) {
        server.getRoomOperations(answerRequest.getRoomId()).sendEvent(Event.ANSWER, answerRequest);
    }

    @OnEvent(value = Event.CANDIDATE)
    public void onCandidateEvent(SocketIOClient client, AckRequest request, CandidateRequest candidateRequest) {
        server.getRoomOperations(candidateRequest.getRoomId()).sendEvent(Event.CANDIDATE, candidateRequest);
    }

    @OnEvent(value = Event.DISCONNECTED)
    public void onDisconnectedEvent(SocketIOClient client, AckRequest request, String roomId) {
        server.getRoomOperations(roomId).sendEvent(Event.DISCONNECTED);
    }
}

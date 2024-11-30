package com.chat.ozx.WebrtcVideoChat.payload;

public class CandidateRequest {
    private String roomId;

    private Object candidate;

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public Object getCandidate() {
        return candidate;
    }

    public void setCandidate(Object candidate) {
        this.candidate = candidate;
    }
}

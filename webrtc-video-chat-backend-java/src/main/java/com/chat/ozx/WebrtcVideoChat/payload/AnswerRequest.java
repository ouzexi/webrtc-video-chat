package com.chat.ozx.WebrtcVideoChat.payload;

public class AnswerRequest {
    private String roomId;

    private Object answer;

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public Object getAnswer() {
        return answer;
    }

    public void setAnswer(Object answer) {
        this.answer = answer;
    }
}

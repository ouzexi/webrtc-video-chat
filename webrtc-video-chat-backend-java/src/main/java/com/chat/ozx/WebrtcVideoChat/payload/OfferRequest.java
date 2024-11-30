package com.chat.ozx.WebrtcVideoChat.payload;

public class OfferRequest {
    private String roomId;

    private Object offer;

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public Object getOffer() {
        return offer;
    }

    public void setOffer(Object offer) {
        this.offer = offer;
    }
}

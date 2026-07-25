package com.example.back_end.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ChatRequest {

    @NotEmpty(message = "messages không được để trống")
    private List<ChatMessageDto> messages;
}

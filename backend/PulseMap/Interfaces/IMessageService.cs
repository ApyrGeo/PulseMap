using Microsoft.AspNetCore.Mvc;
using PulseMap.Domain.DTOs;

namespace PulseMap.Interfaces;

public interface IMessageService
{
    Task<MessageResponseDTO> CreateMessageAsync(MessagePostDTO messageDto);
    Task<ResponseMessageResponseDTO> CreateResponseMessageAsync(int messageId, ResponseMessagePostDTO responseMessagePostDTO);
    Task<MessageResponseDTO> GetMessageByIdAsync(int messageId);
}

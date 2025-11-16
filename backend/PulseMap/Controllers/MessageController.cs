using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;
using System.Threading.Tasks;

namespace PulseMap.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MessageController(IMessageService messageService) : ControllerBase
{
    private readonly IMessageService _messageService = messageService;

    [HttpGet("{messageId}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<MessageResponseDTO>> GetMessage([FromRoute] int messageId)
    {
        return await _messageService.GetMessageByIdAsync(messageId);
    }

    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(422)]
    public async Task<ActionResult<MessageResponseDTO>> CreateMessage([FromBody] MessagePostDTO messageDto)
    {
        var createdMessage = await _messageService.CreateMessageAsync(messageDto);
        return CreatedAtAction(nameof(GetMessage), new { messageId = createdMessage.Id }, createdMessage);
    }

    [HttpPost("{messageId}/responses")]
    public async Task<ActionResult<ResponseMessageResponseDTO>> CreateResponseMessage([FromRoute] int messageId, [FromBody] ResponseMessagePostDTO responseMessagePostDTO)
    {
        var createdMessage = await _messageService.CreateResponseMessageAsync(messageId, responseMessagePostDTO);
        return CreatedAtAction(nameof(GetMessage), new { messageId = createdMessage.Id }, createdMessage);
    }
}

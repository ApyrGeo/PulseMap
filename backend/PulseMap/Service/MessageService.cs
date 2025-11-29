using AutoMapper;
using Backend.Exceptions.Custom;
using log4net;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;
using PulseMap.Service.WS;

namespace PulseMap.Service;

public class MessageService(IMessageRepository messageRepository, IValidatorFactory validatorFactory, IMapper mapper, IWebSocketNotificationService webSocketNotificationService) : IMessageService
{
    private readonly IMapper _mapper = mapper;
    private readonly IMessageRepository _messageRepository = messageRepository;
    private readonly IValidatorFactory _validator = validatorFactory;
    private readonly ILog _logger = LogManager.GetLogger(typeof(MessageService));
    private readonly IWebSocketNotificationService _webSocketNotificationService = webSocketNotificationService;

    public async Task<MessageResponseDTO> CreateMessageAsync(MessagePostDTO messageDto)
    {
        _logger.Info("Validating message");
        var validator = _validator.Get<MessagePostDTO>();
        var result = await validator.ValidateAsync(messageDto);
        if (!result.IsValid)
        {
            throw new EntityValidationException("Invalid message data.");
        }

        _logger.Info("Mapping and creating message");
        var message = _mapper.Map<Message>(messageDto);
        message.SentAt = DateTime.UtcNow;

        var createdMessage = await _messageRepository.AddMessageAsync(message);
        await _messageRepository.SaveChangesAsync();

        var createdMessageDTO = _mapper.Map<MessageResponseDTO>(createdMessage);
        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            ActionType = PayloadActionType.Created,
            EntityType = PayloadEntityType.Message,
            Data = createdMessageDTO
        });

        return createdMessageDTO;
    }

    public async Task<ResponseMessageResponseDTO> CreateResponseMessageAsync(int messageId, ResponseMessagePostDTO responseMessagePostDTO)
    {
        _logger.Info("Validating message");
        var validator = _validator.Get<ResponseMessagePostDTO>();
        var result = await validator.ValidateAsync(responseMessagePostDTO);
        if (!result.IsValid)
        {
            throw new EntityValidationException(result.Errors);
        }

        var parentMessage = await _messageRepository.GetMessageByIdAsync(messageId)
            ?? throw new NotFoundException("Parent Message not found");

        _logger.Info("Mapping and creating message");
        var message = _mapper.Map<ResponseMessage>(responseMessagePostDTO);

        message.ParentMessageId = messageId;
        message.ParentMessage = parentMessage;
        message.LocationId = parentMessage.LocationId;
        message.SentAt = DateTime.UtcNow;

        var createdMessage = await _messageRepository.AddResponseMessageAsync(message);
        await _messageRepository.SaveChangesAsync();

        var createdMessageDTO = _mapper.Map<ResponseMessageResponseDTO>(createdMessage);
        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            ActionType = PayloadActionType.Created,
            EntityType = PayloadEntityType.Response,
            Data = createdMessageDTO
        });

        return createdMessageDTO;
    }

    public async Task<MessageResponseDTO> GetMessageByIdAsync(int messageId)
    {
        _logger.InfoFormat("Retrieving message with ID: {0}", messageId);
        var message = await _messageRepository.GetMessageByIdAsync(messageId)
            ?? throw new NotFoundException("Message not found");

        return _mapper.Map<MessageResponseDTO>(message);
    }
}

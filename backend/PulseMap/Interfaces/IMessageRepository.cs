using PulseMap.Domain;

namespace PulseMap.Interfaces;

public interface IMessageRepository
{
    Task<Message> AddMessageAsync(Message message);
    Task<ResponseMessage> AddResponseMessageAsync(ResponseMessage message);
    Task<Message?> GetMessageByIdAsync(int messageId);
    Task SaveChangesAsync();

    Task DeleteMessagesByLocationIdAsync(int locationId);
}

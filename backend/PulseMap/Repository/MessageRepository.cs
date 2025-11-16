using Microsoft.EntityFrameworkCore;
using PulseMap.Context;
using PulseMap.Domain;
using PulseMap.Interfaces;

namespace PulseMap.Repository;

public class MessageRepository(PulseMapContext context) : IMessageRepository
{
    private readonly PulseMapContext _context = context;
    public async Task<Message> AddMessageAsync(Message message)
    {
        _context.Messages.Add(message);
        return message;
    }

    public Task<ResponseMessage> AddResponseMessageAsync(ResponseMessage message)
    {
        _context.Messages.Add(message);
        return Task.FromResult(message);
    }

    public async Task<Message?> GetMessageByIdAsync(int messageId)
    {
        return await _context.Messages
            .OfType<Message>()
            .Include(m => m.Sender)
            .Include(m => m.Responses)
                .ThenInclude(r =>  r.Sender)
            .SingleOrDefaultAsync(m => m.Id == messageId);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}

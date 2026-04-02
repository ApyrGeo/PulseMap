import { getApiUrl } from '../config/environment';
import { TokenService } from './TokenService';
import { Message, MessagePostDTO, ResponseMessage, ResponseMessagePostDTO } from '../types/location';

export async function addComment(
  tokenService: TokenService,
  messagePostDTO: MessagePostDTO
): Promise<Message> {
  const response = await fetch(`${getApiUrl()}/Message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await tokenService.getAuthHeader()),
    },
    body: JSON.stringify(messagePostDTO),
  });
  if (!response.ok) throw new Error('Failed to add comment');
  return response.json();
}

export async function addResponse(
  tokenService: TokenService,
  message: ResponseMessagePostDTO
): Promise<ResponseMessage> {
  const response = await fetch(`${getApiUrl()}/Message/${message.messageId}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await tokenService.getAuthHeader()),
    },
    body: JSON.stringify({
      content: message.content,
      senderId: message.senderId,
    }),
  });
  if (!response.ok) throw new Error('Failed to add response');
  return response.json();
}

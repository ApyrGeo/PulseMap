import { BASE_API_URL } from '../../core';
import {
  Message,
  MessagePostDTO,
  ResponseMessage,
  ResponseMessagePostDTO,
} from '../Interfaces';

const MESSAGES_URL = `${BASE_API_URL}/Message`;

export async function addComment(
  messagePostDTO: MessagePostDTO
): Promise<Message> {
  const response = await fetch(`${MESSAGES_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messagePostDTO),
  });

  if (!response.ok) {
    throw new Error('Failed to add comment');
  }

  return response.json();
}

export async function addResponse(
  message: ResponseMessagePostDTO
): Promise<ResponseMessage> {
  const response = await fetch(
    `${MESSAGES_URL}/${message.messageId}/responses`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message.content,
        senderId: message.senderId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to add response');
  }

  return response.json();
}

import { postJson } from '../client/httpClient';

export async function submitFeedback({
  messageId,
  question,
  answer,
  rating,
  comment,
  module,
}) {
  return postJson('submitFeedback', {
    messageId,
    question,
    answer,
    rating,
    comment,
    module,
  });
}

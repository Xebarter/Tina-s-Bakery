import { createApiHandler } from '@vercel/node';
import { handleOrderRequest } from '../../../server/pesapal';

export default createApiHandler({
  POST: handleOrderRequest
});

import { v4 as uuidv4 } from 'uuid';

export function generateOrderId(): string {
    return uuidv4();
  }
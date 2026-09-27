import type { IncomingMessage } from "node:http";
import { z } from "zod";

const MAX_BODY_BYTES = 16_384;

/** What the lab may change over HTTP, and nothing else. */
export const backendChange = z
  .object({
    latency: z.literal([0, 400, 6_000]).optional(),
    offline: z.boolean().optional(),
    degraded: z.boolean().optional(),
  })
  .strict();

/** The account a request is sent for, as the client's header carries it. */
export const accountHeader = z
  .string()
  .regex(/^[a-z]{1,32}$/)
  .nullable();

export const photoPath = z.object({ id: z.coerce.number().int().positive() });

export const readRequestBody = async (
  request: IncomingMessage,
): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const bytes: unknown = chunk;

    if (!Buffer.isBuffer(bytes)) {
      throw new Error("Expected a byte stream.");
    }

    size += bytes.length;

    if (size > MAX_BODY_BYTES) {
      throw new Error("Request is too large.");
    }

    chunks.push(bytes);
  }

  const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));

  return body;
};

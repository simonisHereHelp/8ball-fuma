import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { voiceAgentConfig } from "@/lib/voice-agent";

const requestSchema = z.object({
  pageTitle: z.string().default("Docs"),
  pagePath: z.string().default("/docs/pages"),
  pageSlug: z.string().default("docs"),
});

const encodeBase64Url = (value: string) =>
  Buffer.from(value).toString("base64url");

const signJwt = (data: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(data).digest("base64url");

const createLiveKitToken = (params: {
  apiKey: string;
  apiSecret: string;
  identity: string;
  name: string;
  metadata: string;
  room: string;
}) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: params.apiKey,
    sub: params.identity,
    name: params.name,
    metadata: params.metadata,
    nbf: now,
    exp: now + 60 * 60,
    video: {
      room: params.room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    },
  };

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signJwt(`${encodedHeader}.${encodedPayload}`, params.apiSecret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const slugifyRoom = (slug: string) => {
  const cleaned = slug.replace(/[^a-zA-Z0-9-_]/g, "-");
  return cleaned.length > 0 ? cleaned : "docs";
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { pageTitle, pagePath, pageSlug } = requestSchema.parse(body);

  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit is not configured." },
      { status: 500 },
    );
  }

  const room = `docs-${slugifyRoom(pageSlug)}`;
  const metadata = JSON.stringify({
    agent: voiceAgentConfig.nickname,
    instructions: voiceAgentConfig.instructions,
    page: {
      title: pageTitle,
      path: pagePath,
      slug: pageSlug,
    },
  });

  const token = createLiveKitToken({
    apiKey,
    apiSecret,
    identity: crypto.randomUUID(),
    name: "Docs Visitor",
    metadata,
    room,
  });

  return NextResponse.json({
    token,
    url: livekitUrl,
    room,
  });
}

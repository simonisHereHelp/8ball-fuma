import { auth } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const accessToken = (session as any)?.accessToken as string | undefined;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const downloadUrl = new URL(`https://www.googleapis.com/drive/v3/files/${id}`);
  downloadUrl.searchParams.set("alt", "media");
  downloadUrl.searchParams.set("supportsAllDrives", "true");

  const rangeHeader = req.headers.get("range") ?? undefined;

  const upstream = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(rangeHeader ? { Range: rangeHeader } : {}),
    },
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    const message = await upstream.text();
    return NextResponse.json(
      { error: "Failed to fetch PDF", details: message },
      { status: upstream.status },
    );
  }

  const headers = new Headers(upstream.headers);
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", `inline; filename="${id}.pdf"`);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
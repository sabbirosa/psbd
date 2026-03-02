import { NextResponse } from "next/server";

function isPrivateHost(host: string) {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0" || h === "127.0.0.1") return true;
  if (h.startsWith("10.")) return true;
  if (h.startsWith("192.168.")) return true;
  if (h.startsWith("172.")) {
    const second = Number(h.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

function getMeta(html: string, name: string) {
  const re = new RegExp(
    `<meta[^>]+property=["']og:${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  return m?.[1];
}

function getMetaName(html: string, name: string) {
  const re = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  return m?.[1];
}

function getTitle(html: string) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const url = body?.url;
    if (!url) {
      return NextResponse.json({ success: 0 }, { status: 400 });
    }

    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ success: 0 }, { status: 400 });
    }
    if (isPrivateHost(parsed.hostname)) {
      return NextResponse.json({ success: 0 }, { status: 400 });
    }

    const res = await fetch(parsed.toString(), {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; EditorJS-LinkTool; +https://nextjs.org)",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
    });

    const html = await res.text();
    const title = getMeta(html, "title") ?? getTitle(html) ?? parsed.hostname;
    const description =
      getMeta(html, "description") ?? getMetaName(html, "description") ?? "";
    const imageUrl = getMeta(html, "image");

    return NextResponse.json({
      success: 1,
      meta: {
        title,
        description,
        image: imageUrl ? { url: imageUrl } : undefined,
      },
    });
  } catch {
    return NextResponse.json({ success: 0 }, { status: 500 });
  }
}


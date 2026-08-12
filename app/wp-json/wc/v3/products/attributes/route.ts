import { wooRoute } from "@/lib/route-handler";

export const GET = wooRoute("read", async () => {
  const attributes = [
    { id: 1, name: "Cor", slug: "pa_cor", type: "select" },
    { id: 2, name: "Tamanho", slug: "pa_tamanho", type: "select" },
  ];
  return { status: 200, body: attributes };
});

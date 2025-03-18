import { templates } from "./src/lib/tierlist";

self.addEventListener("message", async (msg) => {
  const template_key = msg.data as keyof typeof templates;
  const template_func = templates[template_key];
  if (template_func !== undefined) {
    const template = await template_func();
    self.postMessage(template);
  }
});

<script lang="ts" module>
  const raw = import.meta.glob("../assets/icons/*.html", { eager: true, query: "raw", import: "default" });
  type Icon =
    | "caret-down"
    | "caret-up"
    | "gear"
    | "trash"
    | "palette"
    | "plus-circle"
    | "box-in"
    | "box-out"
    | "floppy"
    | "move";
</script>

<script lang="ts">
  import { type SvelteHTMLElements } from "svelte/elements";
  let {
    icon,
    xmlns = "http://www.w3.org/2000/svg",
    width = 16,
    height = 16,
    viewBox = "0 0 16 16",
    fill = "currentColor",
    ...rest
  }: { icon: Icon } & SvelteHTMLElements["svg"] = $props();
</script>

<svg {xmlns} {width} {height} {viewBox} {fill} {...rest}>
  {@html raw[`../assets/icons/${icon}.html`]}
</svg>

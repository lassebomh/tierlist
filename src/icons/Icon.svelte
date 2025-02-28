<script lang="ts" module>
  const raw = import.meta.glob("./svg/*.html", { eager: true, query: "raw", import: "default" });
  type Icon = "caret-down" | "caret-up" | "gear" | "trash" | "palette" | "plus-circle";
</script>

<script lang="ts">
  let { icon, size = 16 }: { icon: Icon; size?: number } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
  {@html raw[`./svg/${icon}.html`]}
</svg>

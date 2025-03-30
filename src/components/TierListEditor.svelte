<script lang="ts">
  import Icon from "./Icon.svelte";
  import { random_id } from "../lib/utils";
  import { type Item, type TierList } from "../lib/tierlist";
  import { blob_to_dataurl } from "../lib/blob";
  import { flip } from "svelte/animate";

  async function onDrop(e: DragEvent) {
    e.preventDefault();
    if (from === undefined || target === undefined) return;
    if (from.type === "files") {
      const items = new Array<Item>();

      for (const file of e.dataTransfer!.files) {
        items.push({
          id: random_id(),
          src: await blob_to_dataurl(file),
        });
      }

      let destination = target.item_index;
      const target_items =
        target.tier_index === null ? tierlist.uncategorized : tierlist.tiers[target.tier_index].items;
      target_items.splice(destination, 0, ...items);
    } else {
      if (from.tier_index === target.tier_index && from.item_index === target.item_index) {
        return;
      }
      const from_items = from.tier_index === null ? tierlist.uncategorized : tierlist.tiers[from.tier_index].items;
      const from_item = from_items.splice(from.item_index, 1)[0];
      let destination = target.item_index;
      if (!target.before) {
        destination += 1;
      }
      if (from.item_index < destination && from.tier_index === target.tier_index) {
        destination -= 1;
      }
      const target_items =
        target.tier_index === null ? tierlist.uncategorized : tierlist.tiers[target.tier_index].items;
      target_items.splice(destination, 0, from_item);
    }
    from = undefined;
    target = undefined;
  }

  type DragAction = { type: "item"; tier_index: number | null; item_index: number } | { type: "files" };
  type DragTarget = { type: "item"; tier_index: number | null; item_index: number; before: boolean };

  let from = $state<DragAction | undefined>();
  let target = $state<DragTarget | undefined>();

  let { tierlist = $bindable(), mode }: { tierlist: TierList; mode: "mode-delete" | "mode-move" } = $props();

  const tier_elements = $state<HTMLElement[]>([]);
  let tier_uncategorized_element = $state<HTMLElement>()!;

  let scrolling_to_tier = $state<number | null | undefined>();
  let scrolling_reset_timeout: ReturnType<typeof setTimeout>;

  $effect(() => {
    if (scrolling_to_tier !== undefined) {
      if (scrolling_reset_timeout) clearTimeout(scrolling_reset_timeout);
      scrolling_reset_timeout = setTimeout(() => {
        scrolling_to_tier = undefined;
      }, 600);
    }
  });
</script>

<svelte:document
  ondragover={(e) => {
    e.preventDefault();
    target = undefined;
    if (from !== undefined || !e.dataTransfer?.items?.length) {
      return;
    }
    from = { type: "files" };
  }}
  onpaste={async (e) => {
    if (e.clipboardData === null) return;
    e.preventDefault();
    for (const file of e.clipboardData.files) {
      tierlist.uncategorized.unshift({
        id: random_id(),
        src: await blob_to_dataurl(file),
      });
    }
  }}
/>

<div class="tier-jump-buttons-container">
  <div class="tier-jump-buttons">
    {#each tierlist.tiers as tier, tier_index}
      {@const onclick = () => {
        if (scrolling_to_tier === tier_index) return;
        tier_elements[tier_index].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        scrolling_to_tier = tier_index;
      }}
      <button {onclick} ondragover={onclick} class="tier-jump-button" style:color={tier.color}>
        <pre>{tier.name}</pre>
        <!-- <div style="position: absolute; inset: 0; opacity: 0.3;" style:background-color={tier.color}></div> -->
      </button>
    {/each}
    <button
      onclick={() => {
        if (scrolling_to_tier === null) return;
        tier_uncategorized_element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        scrolling_to_tier = null;
      }}
      ondragover={() => {
        if (scrolling_to_tier === null) return;
        tier_uncategorized_element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        scrolling_to_tier = null;
      }}
      class="tier-jump-button"
      style:color="#fff6"
      style:margin-top="12px"
    >
      ?
    </button>
  </div>
</div>

<div class="tier-list {mode}" class:dragging={from !== undefined}>
  {#each tierlist.tiers as tier, tier_index}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="tier"
      bind:this={tier_elements[tier_index]}
      style:background-color={tier.color}
      style:outline-color={tier.color}
      style:user-select={from !== undefined ? "none" : undefined}
      ondragover={(e) => {
        e.preventDefault();
        e.stopPropagation();
        target = { type: "item", tier_index, item_index: 0, before: true };
      }}
      ondrop={onDrop}
    >
      <div
        class="tier-name-edit"
        spellcheck="false"
        style:user-select={from !== undefined ? "none" : undefined}
        contenteditable="true"
        style:font-size={tier.name.trim().length <= 1 ? "3rem" : "1.5rem"}
        style:outline-color={tier.color}
        bind:innerText={tier.name}
      ></div>
      {@render DeleteOverlay(() => {
        tierlist.uncategorized.push(...tier.items);
        tierlist.tiers.splice(tier_index, 1);
      })}
    </div>

    <div class="tier-items">
      <div class="tier-items-backdrop" style:background-color={tier.color}></div>
      {#each tier.items as item, item_index (item.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          animate:flip={{ duration: 150 }}
          class="tier-item"
          draggable="true"
          ondragstart={(e) => {
            if (e.dataTransfer !== null) {
              e.dataTransfer.effectAllowed = "move";
            }
            setTimeout(() => {
              from = { type: "item", item_index, tier_index };
            }, 0);
          }}
          ondragend={() => {
            from = undefined;
            target = undefined;
          }}
        >
          <img src={item.src} alt={item.name ?? ""} height="110" title={item.name} />
          {@render DropHandle(tier_index, item_index, true)}
          {@render DropHandle(
            tier_index,
            item_index,
            true,
            `left: calc(var(--item-size) * -2); z-index: ${1000 - item_index}; border-color: transparent !important;`
          )}
          {@render DropHandle(tier_index, item_index, false)}
          {@render DropHandle(
            tier_index,
            item_index,
            false,
            `right: calc(var(--item-size) * -2); z-index: 0; border-color: transparent !important;`
          )}
          {@render DeleteOverlay(() => {
            tier.items.splice(item_index, 1);
          })}
        </div>
      {/each}
      <div class="drop-handle-container" style="flex-grow:1;">
        {@render DropHandle(tier_index, tier.items.length, true)}
      </div>
    </div>
    <div class="tier-reorder-buttons">
      <button
        title="Move tier up"
        disabled={tier_index === 0}
        onclick={() => {
          [tierlist.tiers[tier_index], tierlist.tiers[tier_index - 1]] = [
            tierlist.tiers[tier_index - 1],
            tierlist.tiers[tier_index],
          ];
        }}
      >
        <Icon icon="caret-up" width={20} height={20} />
      </button>
      <label style="position: relative;">
        <Icon icon="palette" width={20} height={20} />
        <input
          title="Edit color"
          type="color"
          bind:value={tier.color}
          style="width: 0; height: 0; border: none; background: none; bottom: 0; right: 0; position: absolute; padding: 0;"
        />
      </label>
      <button
        title="Move tier down"
        disabled={tier_index === tierlist.tiers.length - 1}
        onclick={() => {
          [tierlist.tiers[tier_index], tierlist.tiers[tier_index + 1]] = [
            tierlist.tiers[tier_index + 1],
            tierlist.tiers[tier_index],
          ];
        }}
      >
        <Icon icon="caret-down" width={20} height={20} />
      </button>
    </div>
  {/each}
  <div class="uncategorized" style:outline={tierlist.uncategorized.length === 0 ? "2px #fff3 dashed" : undefined}>
    <div bind:this={tier_uncategorized_element}></div>
    <div class="tier-items">
      {#each tierlist.uncategorized as item, item_index (item.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="tier-item"
          animate:flip={{ duration: 150 }}
          draggable="true"
          ondragstart={(e) => {
            if (e.dataTransfer !== null) {
              e.dataTransfer.effectAllowed = "move";
            }
            setTimeout(() => {
              from = { type: "item", item_index, tier_index: null };
            }, 0);
          }}
          ondragend={() => {
            from = undefined;
            target = undefined;
          }}
        >
          <img src={item.src} alt={item.name ?? ""} height="110" title={item.name} />
          {@render DropHandle(null, item_index, true)}
          {@render DropHandle(null, item_index, false)}
          {@render DeleteOverlay(() => {
            tierlist.uncategorized.splice(item_index, 1);
          })}
        </div>
      {/each}
      <div class="drop-handle-container" style="flex-grow:1;">
        {@render DropHandle(null, tierlist.uncategorized.length, true)}
      </div>
    </div>
  </div>
</div>

{#snippet DropHandle(tier_index: number | null, item_index: number, before: boolean, style?: string)}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="drop-handle"
    {style}
    class:dragging-over={target?.tier_index === tier_index &&
      ((target?.item_index === item_index && target?.before === before) ||
        (target?.item_index + (before ? 1 : -1) === item_index && target?.before === !before))}
    class:before
    class:after={!before}
    ondragover={(e) => {
      e.preventDefault();
      e.stopPropagation();
      target = { type: "item", tier_index, item_index, before };
    }}
    ondragenter={(e) => e.preventDefault()}
    ondrop={onDrop}
  ></div>
{/snippet}

{#snippet DeleteOverlay(onclick: () => void)}
  {#if mode === "mode-delete"}
    <button class="delete-overlay" {onclick}>
      <Icon icon={"trash"} />
    </button>
  {/if}
{/snippet}

<style>
  .tier-list {
    margin-top: 2rem;
    display: grid;
    grid-template-columns: max-content 1fr auto;
    grid-template-rows: auto;

    --item-size: 110px;
  }

  button,
  label {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.1em;
    font-size: 1.3em;
    line-height: 1;
    color: #fff3;

    &:hover {
      color: white;
    }

    &:disabled {
      pointer-events: none;
    }
  }

  .tier-jump-buttons-container {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  .tier-jump-buttons {
    display: grid;
    grid-template-columns: auto;
    grid-template-rows: auto;
  }

  .tier-jump-button {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    line-height: 1em;
    min-height: 64px;
    min-width: 64px;
    flex-wrap: wrap;
    padding: 0 8px;
    position: relative;
    border: 1px solid #333;
    margin-bottom: -1px;
  }

  .tier-reorder-buttons {
    margin-left: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: start;
    gap: 0em;
    font-size: 1em;
    height: 100%;
    width: 2em;
    aspect-ratio: 1;
  }

  .tier {
    position: relative;
    min-width: var(--item-size);
    padding: 12px;
    box-shadow: inset 0 0 2px #0004;
  }

  .tier-name-edit {
    height: 100%;
    padding: 0px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-weight: 400;
    line-height: 1em;
    color: white;
    white-space: pre-line;

    outline: none !important;
    text-shadow: #0005 0 0 8px;

    .dragging & {
      pointer-events: none;
    }
  }

  .tier-items {
    position: relative;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    min-height: var(--item-size);
    padding-left: 1px;

    .tier-items-backdrop {
      inset: 0;
      position: absolute;
      background-color: #222 !important;
      top: 1px;
      bottom: 1px;
    }
  }

  .tier-item {
    cursor: pointer;
    position: relative;
    touch-action: pan-y pan-x;
    line-height: 0;

    > img {
      height: var(--item-size);
      image-rendering: pixelated;
      padding: 1px;
    }
  }

  .drop-handle {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border: 2px solid transparent;
    z-index: 10000;
    --drop-target-border-color: rgba(255, 255, 255, 1);

    &.after {
      left: 50%;
      &.dragging-over {
        border-right-color: var(--drop-target-border-color);
      }
    }
    &.before {
      right: 50%;
      &.dragging-over {
        border-left-color: var(--drop-target-border-color);
      }
    }

    .dragging & {
      pointer-events: all;
    }
  }

  :first-child > .drop-handle.before {
    border-width: 4px;
  }

  .drop-handle-container {
    position: relative;
    .drop-handle {
      left: 0;
      right: 0;
    }
  }

  .uncategorized {
    border-radius: 6px;

    outline-offset: -2px;
    background: transparent;
    grid-column: 2 / 3;
    display: flex;
    flex-direction: column;
    position: relative;
    margin-top: 1em;

    .tier-items {
      background-color: transparent;
    }
  }
  .delete-overlay {
    inset: 0;
    background-color: #0006;
    position: absolute;
    justify-content: start;
    padding: 8px;
    color: #ddd;
    align-items: start;
    display: flex;
    aspect-ratio: unset;
    opacity: 1;

    &:hover {
      outline: 2px solid cornflowerblue;
      opacity: 1;
      z-index: 1;
    }
  }

  .scroll-to-top {
    position: fixed;
    top: 50%;
    font-family: inherit;
    font-size: inherit;
    flex-direction: column;
    left: 1px;
    color: #fff5;
    border: 2px solid #fff2;
    white-space: nowrap;
    padding: 1.5rem 1.5rem;
    background-color: #0007;

    &:hover {
      background-color: #000a;
      border: 2px solid #ffff;
    }

    &.highlight {
      color: #fff8;
      background-color: #000c;
      border-color: #fff5;
    }
  }

  .templates {
    list-style: disclosure-closed;
    button {
      font: inherit;
      color: inherit;

      margin: 0 -4px;
      padding: 0 4px;

      &:hover {
        outline: 1px solid cornflowerblue;
      }
    }
  }

  /* @media (700px >= width) {
    .tier {
      min-width: 50px;
    }
    .tier-reorder-buttons {
      width: 40px;
    }

    .tier-list {
      margin-top: 1rem;
    }
  } */
</style>

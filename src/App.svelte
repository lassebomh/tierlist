<script lang="ts">
  import { flip } from "svelte/animate";

  type Item = {
    src: string;
    id: number;
  };

  type Tier = { name: string; items: Item[]; hue: number };

  async function onDrop(e: DragEvent, tier_index: number | null) {
    e.preventDefault();
    if (from === undefined || target === undefined) return;
    if ("length" in from) {
      const items = await filesToItems(...e.dataTransfer!.files);
      let destination = target.item_index;
      const target_items = target.tier_index === null ? uncategorized : tiers[target.tier_index].items;
      target_items.splice(destination, 0, ...items);
    } else {
      if (from.tier_index === target.tier_index && from.item_index === target.item_index) {
        return;
      }
      const from_items = from.tier_index === null ? uncategorized : tiers[from.tier_index].items;
      const from_item = from_items.splice(from.item_index, 1)[0];
      let destination = target.item_index;
      if (from.item_index < destination && from.tier_index === tier_index) {
        destination -= 1;
      }
      const target_items = target.tier_index === null ? uncategorized : tiers[target.tier_index].items;
      target_items.splice(destination, 0, from_item);
    }
    from = undefined;
    target = undefined;
  }

  function filesToItems(...files: File[]): Promise<Item[]> {
    return Promise.all(
      files
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => {
          return new Promise<Item>((resolve) => {
            const fileReader = new FileReader();

            fileReader.readAsDataURL(file);

            fileReader.addEventListener("load", () => {
              resolve({
                id: Math.random(),
                src: fileReader.result as string,
              });
            });
          });
        }),
    );
  }

  let from = $state<{ tier_index: number | null; item_index: number } | DataTransferItemList | undefined>();
  let target = $state<{ tier_index: number | null; item_index: number; before: boolean } | undefined>();

  let tiers = $state<Tier[]>([
    {
      name: "S",
      items: [],
      hue: 0,
    },
    {
      name: "A",
      items: [],
      hue: 30,
    },
    {
      name: "B",
      items: [],
      hue: 45,
    },
    {
      name: "C",
      items: [],
      hue: 60,
    },
    {
      name: "F",
      items: [],
      hue: 180,
    },
  ]);

  let uncategorized = $state<Item[]>([]);
</script>

<svelte:document
  ondragover={(e) => {
    e.preventDefault();
    if (from !== undefined || !e.dataTransfer?.items?.length) {
      return;
    }
    from = e.dataTransfer.items;
  }}
  onpaste={async (e) => {
    if (e.clipboardData === null) return;
    e.preventDefault();

    uncategorized.push(...(await filesToItems(...e.clipboardData.files)));
  }}
/>
<main class:dragging={from !== undefined}>
  <div class="tier-list">
    {#each tiers as tier, tier_index}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="tier-name drop-handle-container"
        style:background-color="hsl({tier.hue}deg, 100%, 75%)"
        style:border="2px solid hsl({tier.hue}deg, 90%, 70%)"
        ondragover={(e) => {
          e.preventDefault();
          target = { tier_index, item_index: 0, before: true };
        }}
        ondrop={async (e) => {
          onDrop(e, tier_index);
        }}
      >
        <div class="tier-name-edit" contenteditable="true" bind:textContent={tier.name}></div>
      </div>

      <div class="tier-items">
        {#each tier.items as item, item_index (item.id)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="tier-item"
            draggable="true"
            ondragstart={() => (from = { item_index, tier_index })}
            ondragend={() => {
              from = undefined;
              target = undefined;
            }}
          >
            <img src={item.src} alt="" />
            {@render DropHandle(tier_index, item_index, true)}
            {@render DropHandle(tier_index, item_index, false)}
          </div>
        {/each}
        <div class="drop-handle-container" style="flex-grow:1;">
          {@render DropHandle(tier_index, tier.items.length, true)}
        </div>
      </div>
    {/each}
  </div>
  <div class="uncategorized">
    <h2>Uncategorized</h2>
    <div class="tier-items">
      {#each uncategorized as item, item_index (item.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="tier-item"
          draggable="true"
          ondragstart={() => (from = { item_index, tier_index: null })}
          ondragend={() => {
            from = undefined;
            target = undefined;
          }}
        >
          <img src={item.src} alt="" />
          {@render DropHandle(null, item_index, true)}
          {@render DropHandle(null, item_index, false)}
        </div>
      {/each}
      <div class="drop-handle-container" style="flex-grow:1;">
        {@render DropHandle(null, uncategorized.length, true)}
      </div>
    </div>
  </div>
</main>

{#snippet DropHandle(tier_index: number | null, item_index: number, before: boolean)}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="drop-handle"
    class:dragging-over={target?.tier_index === tier_index &&
      ((target?.item_index === item_index && target?.before === before) ||
        (target?.item_index + (before ? 1 : -1) === item_index && target?.before === !before))}
    class:before
    class:after={!before}
    ondragover={(e) => {
      e.preventDefault();
      target = { tier_index, item_index, before };
    }}
    ondragenter={(e) => e.preventDefault()}
    ondrop={(e) => {
      onDrop(e, tier_index);
    }}
  ></div>
{/snippet}

<style>
  .tier-list {
    display: grid;
    grid-template-columns: max-content 1fr;
    grid-template-rows: 1fr;
  }

  .tier-name-edit {
    min-width: 80px;
    height: 100%;
    padding: 10px;
    color: black;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-weight: 400;
    font-size: 1.1em;

    .dragging & {
      pointer-events: none;
    }
  }

  .tier-items {
    min-height: 80px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    background-color: #fff1;
  }

  .tier-item {
    display: content;
    cursor: pointer;
    position: relative;
    line-height: 0;
  }

  .drop-handle {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border: 1px solid transparent;
    --drop-target-border-color: cornflowerblue;

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
    border-width: 2px;
  }

  .drop-handle-container {
    position: relative;
    .drop-handle {
      left: 0;
      right: 0;
    }
  }
</style>

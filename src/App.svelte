<script lang="ts">
  import Icon from "./components/Icon.svelte";
  import { download, randomId, readAsDataURL, readAsText, slugify, uploadMultiple, uploadSingle } from "./lib/utils";
  import tierListDefault from "./assets/tierlists/default.json";

  type Item = {
    src: string;
    id: number;
  };

  type Tier = { name: string; items: Item[]; color: string };

  type TierList = {
    name: string;
    tiers: Tier[];
    uncategorized: Item[];
  };

  async function onDrop(e: DragEvent) {
    e.preventDefault();
    if (from === undefined || target === undefined) return;
    if ("length" in from) {
      const items = await filesToItems(...e.dataTransfer!.files);
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

  function filesToItems(...files: File[]): Promise<Item[]> {
    return Promise.all(
      files
        .filter((file) => file.type.startsWith("image/"))
        .map(async (file) => ({
          id: randomId(),
          src: await readAsDataURL(file),
        }))
    );
  }

  let from = $state<{ tier_index: number | null; item_index: number } | DataTransferItemList | undefined>();
  let target = $state<{ tier_index: number | null; item_index: number; before: boolean } | undefined>();

  let mode = $state<"mode-move" | "mode-delete">("mode-move");

  let tierlist = $state<TierList>(tierListDefault);
</script>

<svelte:document
  ondragover={(e) => {
    e.preventDefault();
    target = undefined;
    if (from !== undefined || !e.dataTransfer?.items?.length) {
      return;
    }
    from = e.dataTransfer.items;
  }}
  onpaste={async (e) => {
    if (e.clipboardData === null) return;
    e.preventDefault();
    tierlist.uncategorized.push(...(await filesToItems(...e.clipboardData.files)));
  }}
/>
<main class:dragging={from !== undefined} class={mode}>
  <div class="tier-list">
    <div class="tier-list-mode-buttons">
      <button class="tier-list-mode-move" class:active={mode === "mode-move"} onclick={() => (mode = "mode-move")}>
        <Icon icon={"move"} />
      </button>
      <button
        class="tier-list-mode-delete"
        class:active={mode === "mode-delete"}
        onclick={() => (mode = "mode-delete")}
      >
        <Icon icon={"trash"} />
      </button>
    </div>
    <div class="tier-list-meta-buttons">
      <input class="tier-list-title" placeholder="Enter a name..." type="text" bind:value={tierlist.name} />
      <button
        onclick={async () => {
          const file = await uploadSingle("application/json");
          if (file === null) return;
          tierlist = JSON.parse(await readAsText(file));
        }}
      >
        <Icon icon={"box-out"} width={24} height={24} />
      </button>
      <button
        onclick={() => {
          download(slugify(tierlist.name) + ".json", JSON.stringify(tierlist, undefined, 2));
        }}
      >
        <Icon icon={"box-in"} width={24} height={24} />
      </button>
    </div>
    <div></div>

    {#each tierlist.tiers as tier, tier_index}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="tier"
        style:background-color={tier.color}
        ondragover={(e) => {
          e.preventDefault();
          e.stopPropagation();
          target = { tier_index, item_index: 0, before: true };
        }}
        ondrop={onDrop}
      >
        <div class="tier-name-edit" contenteditable="true" bind:textContent={tier.name}></div>
        {@render DeleteOverlay(() => {
          tierlist.uncategorized.push(...tier.items);
          tierlist.tiers.splice(tier_index, 1);
        })}
      </div>

      <div class="tier-items">
        {#each tier.items as item, item_index (item.id)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="tier-item"
            draggable="true"
            ondragstart={(e) => {
              if (e.dataTransfer !== null) {
                e.dataTransfer.effectAllowed = "move";
              }
              setTimeout(() => {
                from = from = { item_index, tier_index };
              }, 0);
            }}
            ondragend={() => {
              from = undefined;
              target = undefined;
            }}
          >
            <img src={item.src} alt="" />
            {@render DropHandle(tier_index, item_index, true)}
            {@render DropHandle(tier_index, item_index, false)}
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
          disabled={tier_index === 0}
          onclick={() => {
            [tierlist.tiers[tier_index], tierlist.tiers[tier_index - 1]] = [
              tierlist.tiers[tier_index - 1],
              tierlist.tiers[tier_index],
            ];
          }}
        >
          <Icon icon="caret-up" width={16} height={16} />
        </button>
        <label style="position: relative;">
          <Icon icon="palette" width={14} height={14} />
          <input
            type="color"
            bind:value={tier.color}
            style="width: 0; height: 0; border: none; background: none; bottom: 0; right: 0; position: absolute;"
          />
        </label>
        <button
          disabled={tier_index === tierlist.tiers.length - 1}
          onclick={() => {
            [tierlist.tiers[tier_index], tierlist.tiers[tier_index + 1]] = [
              tierlist.tiers[tier_index + 1],
              tierlist.tiers[tier_index],
            ];
          }}
        >
          <Icon icon="caret-down" width={16} height={16} />
        </button>
      </div>
    {/each}
    <div></div>
    <div class="tier-create">
      <button
        onclick={() => {
          tierlist.tiers.push({
            color: "#ececec",
            items: [],
            name: "",
          });
        }}
      >
        <Icon icon="plus-circle" width={24} height={24} />
      </button>
    </div>
    <div></div>
    <div></div>
    <div class="uncategorized">
      <div class="tier-items">
        {#each tierlist.uncategorized as item, item_index (item.id)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="tier-item"
            draggable="true"
            ondragstart={(e) => {
              if (e.dataTransfer !== null) {
                e.dataTransfer.effectAllowed = "move";
              }
              setTimeout(() => {
                from = { item_index, tier_index: null };
              }, 0);
            }}
            ondragend={() => {
              from = undefined;
              target = undefined;
            }}
          >
            <img src={item.src} alt="" />
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
  <!-- <button class="upload-images">Upload images</button> -->
  <h3>Uploading an image</h3>
  <ul class="how-to-upload">
    <li><div>Paste an image from your clipboard.</div></li>
    <li><div>Drag an image from your desktop</div></li>
    <li>
      <div>
        Select images to upload
        <button
          style="display: inline; color: white;"
          onclick={async () => {
            let files = await uploadMultiple("image/*");
            if (files === null) return;
            tierlist.uncategorized.push(...(await filesToItems(...files)));
          }}
        >
          <Icon icon={"box-out"} width={16} height={16} />
        </button>
      </div>
    </li>
  </ul>
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
      e.stopPropagation();
      target = { tier_index, item_index, before };
    }}
    ondragenter={(e) => e.preventDefault()}
    ondrop={onDrop}
  ></div>
{/snippet}

{#snippet DeleteOverlay(onclick: () => void)}
  <button class="delete-overlay" {onclick}>
    <Icon icon={"trash"} />
  </button>
{/snippet}

<style>
  .delete-overlay {
    inset: 0;
    background-color: #0006;
    position: absolute;
    justify-content: start;
    padding: 8px;
    color: #ddd;
    align-items: start;
    display: none;
    aspect-ratio: unset;
    opacity: 1;

    &:hover {
      outline: 2px solid cornflowerblue;
      opacity: 1;
      z-index: 1;
    }

    .mode-delete & {
      display: flex;
    }
  }

  main {
    margin: 5vmin auto;
    min-width: 100vmin;
    width: 70vw;
    max-width: 100vw;
    padding: 0 12px;
    flex-grow: 1;
  }

  .tier-list {
    display: grid;
    grid-template-columns: max-content 1fr auto;
    grid-template-rows: 1fr;
  }

  .tier-list-meta-buttons {
    display: flex;
    margin-bottom: 8px;
  }

  .tier-list-title {
    background-color: #ffffff09;
    border-radius: 2px;
    border: none;
    color: white;
    font-size: 1em;
    padding: 8px;
    flex-grow: 1;
    margin-right: 4px;
    margin-left: 8px;
  }

  .tier {
    box-shadow: inset 0px 0px 20px 3px #0002;
    position: relative;
  }

  .tier-create {
    display: flex;
    justify-content: center;
    align-items: start;
    padding: 8px;
    grid-column: 1 / 3;

    > button {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1;
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
  }

  .tier-list-mode-buttons {
    display: flex;
    padding: 0 0 8px 0;

    .tier-list-mode-move,
    .tier-list-mode-delete {
      border: 1px solid #666;
      color: #bbb;
      flex-grow: 1;
      aspect-ratio: unset;
      border-radius: 4px;
      opacity: 0.5;

      &.active {
        opacity: 0.75;
        color: #fff;
        background-color: #fff1;
        border-color: #888;
        z-index: 1;
      }

      &:hover {
        opacity: 1;
      }
    }

    .tier-list-mode-move {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      margin-right: -0.5px;
    }
    .tier-list-mode-delete {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      margin-left: -0.5px;
    }
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

  .tier-reorder-buttons {
    margin-left: 6px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0em;
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
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    background-color: #fff1;
    min-height: 80px;

    :where(&:not(:nth-child(3))) {
      border-top: 1px solid #0005;
      margin-top: -1px;
    }
  }

  .tier-item {
    display: content;
    cursor: pointer;
    position: relative;
    line-height: 0;

    > img {
      max-height: 100px;
    }
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

  .uncategorized {
    border-radius: 6px;
    outline: 2px #fff3 dashed;
    outline-offset: -2px;
    background: transparent;
    grid-column: 1 / 3;
    display: flex;
    flex-direction: column;
    position: relative;

    .tier-items {
      background-color: transparent;
    }
  }

  .how-to-upload {
    li > div {
      display: flex;
      align-items: center;
      gap: 0.25em;
      flex-wrap: wrap;
    }
  }
</style>

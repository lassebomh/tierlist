<script lang="ts">
  import Icon from "./components/Icon.svelte";
  import { download_file, slugify, request_multi_file_upload, request_file_upload, random_id } from "./lib/utils";
  import { templates, type TierList } from "./lib/tierlist";
  import { blob_to_dataurl, blob_to_text, extract_image_segments } from "./lib/blob";
  import TierListEditor from "./components/TierListEditor.svelte";
  import Service from "../service?worker";
  import { onDestroy } from "svelte";
  import { on } from "svelte/events";

  let tierlist = $state<TierList>(templates.empty());

  const service = new Service();

  service.postMessage(window.location.search.substring(2));

  onDestroy(on(service, "message", (e) => (tierlist = (e as any).data)));

  let mode = $state<"mode-delete" | "mode-move">("mode-move");
</script>

<main class={mode}>
  <div class="tier-list-mode-buttons">
    <button
      title="Move mode"
      class="tier-list-mode-move"
      class:active={mode === "mode-move"}
      onclick={() => (mode = "mode-move")}
    >
      <Icon icon={"move"} />
    </button>
    <button
      title="Delete mode"
      class="tier-list-mode-delete"
      class:active={mode === "mode-delete"}
      onclick={() => (mode = "mode-delete")}
    >
      <Icon icon={"trash"} />
    </button>
  </div>

  <TierListEditor bind:tierlist {mode} />

  <div class="information">
    <div>
      <h3>Actions</h3>
      <ul class="actions">
        <li>
          <button
            onclick={async () => {
              let files = await request_multi_file_upload("image/*");
              if (files === null) return;
              for (const file of files) {
                tierlist.uncategorized.push({
                  id: random_id(),
                  src: await blob_to_dataurl(file),
                });
              }
            }}>Upload images</button
          >
        </li>
        <li>
          <button
            onclick={async () => {
              let file = await request_file_upload("image/*");
              if (file === null) return;

              const blobs = await extract_image_segments(file);
              const dataUrls = await Promise.all(blobs.map(blob_to_dataurl));

              tierlist.uncategorized.push(
                ...dataUrls.map((url) => ({
                  id: random_id(),
                  src: url,
                }))
              );
            }}>Upload a spritesheet</button
          >
        </li>
      </ul>
      <ul class="actions">
        <li>
          <button
            onclick={() =>
              tierlist.tiers.push({
                color: "#666666",
                name: "X",
                items: [],
              })}>Create a new tier</button
          >
        </li>
      </ul>

      <ul class="actions">
        <li>
          <button
            onclick={() => {
              download_file(slugify(tierlist.name) + ".json", JSON.stringify(tierlist, undefined, 2));
            }}>Save</button
          >
        </li>
        <li>
          <button
            onclick={async () => {
              const file = await request_file_upload("application/json");
              if (file === null) return;
              tierlist = JSON.parse(await blob_to_text(file));
            }}>Load</button
          >
        </li>
      </ul>
    </div>
    <div>
      <h3>Templates</h3>
      <ul class="actions">
        <li><a href="./">Empty</a></li>
        <li><a href="./?/melee">Super Smash Bros. Melee</a></li>
        <li>
          <a href="./?/tabg-blessings">Totally Accurate Battlegrounds (Blessings)</a>
        </li>
        <li>
          <a href="./?/tabg-grenades">Totally Accurate Battlegrounds (Grenades)</a>
        </li>
        <li>
          <a href="./?/balatro">Balatro</a>
        </li>
      </ul>
    </div>
  </div>
</main>

<style>
  main {
    margin: 5vmin auto;
    min-width: 95vmin;
    width: 80vw;
    max-width: 100vw;
    padding: 0 12px;
    /* perspective: 8000px; */
    flex-grow: 1;
    margin-bottom: 100vh;
  }

  .tier-list-meta-buttons {
    display: flex;
    margin-bottom: 8px;
  }

  .tier-list-mode-buttons {
    display: flex;
    padding: 0;

    .tier-list-mode-move,
    .tier-list-mode-delete {
      border: 1px solid #666;
      color: #bbb;
      aspect-ratio: unset;
      border-radius: 4px;
      opacity: 0.5;
      height: 35px;
      aspect-ratio: 1;

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

  button {
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

  h3 {
    margin-top: 1.5rem;
    margin-bottom: 0.2rem;
    padding-bottom: 0;
  }
  ul {
    margin-top: 0.2rem;
    padding-left: 1rem;
  }

  .information {
    max-width: 800px;
    margin: auto;
    margin-top: 3em;
    padding: 0 1rem;
  }

  .actions {
    list-style: disclosure-closed;

    button {
      font: inherit;
      color: inherit;
      text-align: left;

      margin: 0 -4px;
      padding: 0 4px;

      &:hover {
        outline: 1px solid cornflowerblue;
      }
    }
  }

  @media (700px >= width) {
    main {
      padding: 0;
      width: 100%;
      margin-top: 1rem;
    }

    .tier-list-mode-buttons {
      justify-content: center;
      margin-bottom: 0;
    }
  }
</style>

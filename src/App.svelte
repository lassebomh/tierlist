<script lang="ts">
  import Icon from "./components/Icon.svelte";
  import { download_file, slugify, random_id } from "./lib/utils";
  import { templates, type TierList } from "./lib/tierlist";
  import { blob_to_dataurl, blob_to_text, extract_image_segments } from "./lib/blob";
  import TierListEditor from "./components/TierListEditor.svelte";

  let tierlist = $state<TierList>(templates.empty());

  {
    const template_key = window.location.search.substring(2) as keyof typeof templates;
    const template_func = templates[template_key];
    if (template_func !== undefined) {
      const maybePromise = template_func();
      if (maybePromise instanceof Promise) {
        maybePromise.then((value) => {
          tierlist = value;
        });
      } else {
        tierlist = maybePromise;
      }
    }
  }

  $inspect(tierlist.tiers[0].name);

  let mode = $state<"mode-delete" | "mode-move">("mode-move");
</script>

<main class={mode}>
  <div class="tier-actions">
    <div class="btn-group">
      <button class="btn" title="Move mode" class:active={mode === "mode-move"} onclick={() => (mode = "mode-move")}>
        <Icon icon={"move"} />
      </button>
      <button
        class="btn"
        title="Delete mode"
        class:active={mode === "mode-delete"}
        onclick={() => (mode = "mode-delete")}
      >
        <Icon icon={"trash"} />
      </button>
    </div>

    <div class="btn-group">
      <button
        class="btn"
        title="Save"
        onclick={() => download_file(slugify(tierlist.name) + ".json", JSON.stringify(tierlist, undefined, 2))}
      >
        Save
      </button>
      <label class="btn">
        Load
        <input
          type="file"
          accept="application/json"
          onchange={async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files?.length !== 1) return;
            tierlist = JSON.parse(await blob_to_text(files[0]));
          }}
        />
      </label>
    </div>
    <button
      class="btn"
      onclick={() =>
        tierlist.tiers.push({
          color: "#666666",
          name: "X",
          items: [],
        })}>New tier</button
    >

    <div class="btn-group">
      <label class="btn">
        Upload image
        <input
          type="file"
          multiple
          accept="image/*"
          onchange={async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files?.length) return;
            for (const file of files) {
              tierlist.uncategorized.unshift({
                id: random_id(),
                src: await blob_to_dataurl(file),
              });
            }
          }}
        />
      </label>
      <label class="btn">
        spritesheet
        <input
          type="file"
          accept="image/*"
          onchange={async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files?.length !== 1) return;

            const blobs = await extract_image_segments(files[0]);
            const dataUrls = await Promise.all(blobs.map(blob_to_dataurl));

            tierlist.uncategorized.push(
              ...dataUrls.map((url) => ({
                id: random_id(),
                src: url,
              }))
            );
          }}
        />
      </label>
    </div>
  </div>

  <TierListEditor bind:tierlist {mode} />

  <div class="information">
    <div>
      <h3>Templates</h3>
      <ul class="actions">
        <li><a href="./">Empty</a></li>
        <li><a href="./?/melee">Super Smash Bros. Melee</a></li>
        <li>
          <a href="./?/tabg-blessings">Totally Accurate Battlegrounds (Blessings)</a>
        </li>
        <li>
          <a href="./?/balatro">Balatro</a>
        </li>
        <li>
          <a href="./?/flags">Flags</a>
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
    flex-grow: 1;
    margin-bottom: 100vh;
  }

  .tier-actions {
    display: flex;
    padding: 0;
    gap: 6px;
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
  /* 
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
  } */
</style>
